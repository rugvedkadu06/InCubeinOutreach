import os
import io
import re
import uuid
import datetime as _dt
from datetime import datetime
from typing import Optional, List

from ..core.database import get_db_connection, get_mongo_db
from ..core.exceptions import NotFoundError, BadRequestError, ServiceError
from ..schemas.incubein import (
    UpdatePriorityRequest,
    AddCohortToEcosystemRequest,
    ScrapeEnrichRequest,
    BatchEnrichRequest,
    AddIncubatorsToEcosystemRequest,
    MilestoneRequest,
)
from .evaluator import (
    encrypt_val,
    decrypt_val,
    clean_revenue,
    clean_team_size,
    clean_dpiit,
    extract_dynamic_rows_and_headers,
    evaluate_dynamic_features,
    evaluate_rules,
    evaluate_advanced_heuristics,
    compute_similarity_matrix
)


def process_cohort_excel(contents: bytes, entity_type: str):
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = wb.active

        headers, rows_data, header_map = extract_dynamic_rows_and_headers(sheet)

        if not rows_data:
            return {"status": "error", "message": "No valid data rows found in the uploaded Excel file."}

        startups = []
        for row_info in rows_data:
            row_idx = row_info["row_idx"]
            entity_name = row_info["entity_name"]
            raw_data = row_info["raw_data"]
            row_values = row_info["row_values"]

            def get_col_val(key):
                idx = header_map.get(key)
                if idx is not None and idx < len(row_values):
                    return row_values[idx]
                return None

            dpiit_registered_val = get_col_val("dpiit_registered")
            has_dpiit, dpiit_num = clean_dpiit(dpiit_registered_val)

            raw_rev = get_col_val("revenue")
            rev_val = clean_revenue(raw_rev)

            raw_team = get_col_val("team_size")
            team_size_val = clean_team_size(raw_team)

            # Build record with both structured & dynamic raw data
            startup_data = {
                "id_temp": f"temp_{row_idx}",
                "entity_type": entity_type,
                "startup_name": entity_name,
                "name": str(get_col_val("name") or entity_name).strip(),
                "sector": str(get_col_val("sector") or "General").strip(),
                "stage": str(get_col_val("stage") or "Active").strip(),
                "revenue": rev_val,
                "team_size": team_size_val,
                "dpiit": has_dpiit,
                "dpiit_number": dpiit_num,
                "website": str(get_col_val("website") or "").strip(),
                "pitch_deck_url": str(get_col_val("pitch_deck_url") or "").strip(),
                "business_summary": str(get_col_val("business_summary") or raw_data.get(headers[0], "") if headers else "").strip(),
                "competitors": str(get_col_val("competitors") or "").strip(),
                "applied_other": str(get_col_val("applied_other") or "").strip(),
                "litigation": str(get_col_val("litigation") or "").strip(),
                "highest_qualification": str(get_col_val("highest_qualification") or "").strip(),
                "school_university": str(get_col_val("school_university") or "").strip(),
                "gender": str(get_col_val("gender") or "").strip(),
                "city_state": str(get_col_val("city_state") or "").strip(),
                "comments": str(get_col_val("comments") or "").strip(),
                "legal_entity": str(get_col_val("legal_entity") or "").strip(),
                "applying_for": str(get_col_val("applying_for") or "").strip(),
                "timestamp": str(get_col_val("timestamp") or "").strip(),
                # Dynamic Excel column data
                "all_columns": [h for h in headers if h],
                "raw_data": raw_data
            }

            # Rule Engine Evaluation
            rule_score, rule_breakdown = evaluate_rules(startup_data)
            startup_data["rule_score"] = rule_score
            startup_data["rule_breakdown"] = rule_breakdown

            # Advanced Heuristics
            eval_result = evaluate_advanced_heuristics(startup_data)

            # Dynamic Features Evaluation for random columns
            dynamic_score, feature_scores, dyn_strengths, dyn_weaknesses = evaluate_dynamic_features(raw_data, headers)
            startup_data["feature_scores"] = feature_scores
            startup_data["dynamic_score"] = dynamic_score

            # Blended final score: combines rule score & dynamic column evaluation
            if len(headers) > 6:
                final_score_val = round((rule_score * 0.4) + (dynamic_score * 0.6), 1)
            else:
                final_score_val = round(rule_score, 1)

            startup_data["final_score"] = final_score_val
            startup_data["llm_score"] = eval_result["llm_score"]

            # Merge strengths & weaknesses
            all_strengths = list(dict.fromkeys(eval_result["strengths"] + dyn_strengths))
            all_weaknesses = list(dict.fromkeys(eval_result["weaknesses"] + dyn_weaknesses))

            startup_data["evaluation"] = {
                "innovation": eval_result["innovation"],
                "market": eval_result["market"],
                "scalability": eval_result["scalability"],
                "execution": eval_result["execution"],
                "problem": eval_result["problem"],
                "strengths": all_strengths[:4],
                "weaknesses": all_weaknesses[:4],
                "recommendation": eval_result["recommendation"]
            }

            if final_score_val >= 70:
                priority_val = "High"
            elif final_score_val >= 40:
                priority_val = "Medium"
            else:
                priority_val = "Low"
            startup_data["priority"] = priority_val

            # Fallback PII resolution from raw_data if mapped header was missing
            detected_email = get_col_val("email")
            detected_name = get_col_val("name") or entity_name
            detected_mobile = get_col_val("mobile")
            detected_address = get_col_val("address") or get_col_val("city_state")

            if not detected_email:
                for k, v in raw_data.items():
                    if v and "@" in v and "." in v and not str(v).startswith("http"):
                        detected_email = v
                        break

            if not detected_mobile:
                for k, v in raw_data.items():
                    if v and re.search(r"^[+]?\d{10,12}$", str(v).replace(" ", "").replace("-", "")):
                        detected_mobile = v
                        break

            if not detected_address:
                for k, v in raw_data.items():
                    if v and any(loc in k.lower() for loc in ["city", "state", "address", "location", "region"]):
                        detected_address = v
                        break

            # PII fields encryption
            startup_data["encrypted_fields"] = {
                "name": encrypt_val(detected_name),
                "email": encrypt_val(detected_email),
                "mobile": encrypt_val(detected_mobile),
                "alternet_mobile": encrypt_val(get_col_val("alternet_mobile")),
                "dob": encrypt_val(get_col_val("dob")),
                "address": encrypt_val(detected_address),
            }

            startups.append(startup_data)

        if not startups:
            return {"status": "error", "message": "No valid startup/incubator rows processed."}

        # Compute similarity matrix across summary / text fields
        startups = compute_similarity_matrix(startups)

        # Sort by final score & rank
        startups.sort(key=lambda x: x["final_score"], reverse=True)
        for rank_idx, s in enumerate(startups):
            s["rank"] = rank_idx + 1
            if "id_temp" in s:
                del s["id_temp"]

        # Save to MongoDB
        db = get_mongo_db()
        # Delete existing entries of the same entity_type (or all if unspecified)
        db["incubein_applications"].delete_many({"$or": [{"entity_type": entity_type}, {"entity_type": {"$exists": False}}]})
        db["incubein_applications"].insert_many(startups)

        return {
            "status": "success",
            "message": f"Successfully processed and stored {len(startups)} {entity_type} entries with {len(headers)} columns.",
            "columns_count": len(headers)
        }
    except Exception as e:
        raise ServiceError(f"Failed to process cohort excel: {str(e)}")


def get_applications(entity_type: Optional[str] = None):
    try:
        db = get_mongo_db()
        query = {}
        if entity_type:
            query = {"$or": [{"entity_type": entity_type}, {"entity_type": {"$exists": False}}]}

        cursor = db["incubein_applications"].find(query).sort("rank", 1)
        applications = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])

            # Decrypt sensitive fields on the fly
            enc = doc.get("encrypted_fields", {})
            doc["name"] = decrypt_val(enc.get("name", "")) or doc.get("name", "")
            doc["email"] = decrypt_val(enc.get("email", ""))
            doc["mobile"] = decrypt_val(enc.get("mobile", ""))
            doc["alternet_mobile"] = decrypt_val(enc.get("alternet_mobile", ""))
            doc["dob"] = decrypt_val(enc.get("dob", ""))
            doc["address"] = decrypt_val(enc.get("address", ""))

            if "encrypted_fields" in doc:
                del doc["encrypted_fields"]

            applications.append(doc)
        return applications
    except Exception as e:
        raise ServiceError(str(e))


def delete_applications():
    try:
        db = get_mongo_db()
        db["incubein_applications"].delete_many({})
        return {"status": "success", "message": "All startup applications cleared successfully."}
    except Exception as e:
        raise ServiceError(str(e))


def update_application_priority(req: UpdatePriorityRequest):
    try:
        db = get_mongo_db()
        from bson import ObjectId
        if req.priority not in ["High", "Medium", "Low"]:
            raise BadRequestError("Invalid priority value. Must be High, Medium, or Low.")

        result = db["incubein_applications"].update_one(
            {"_id": ObjectId(req.app_id)},
            {"$set": {"priority": req.priority}}
        )
        if result.matched_count == 0:
            raise NotFoundError("Application not found.")

        return {"status": "success", "message": f"Successfully updated priority to {req.priority}."}
    except BadRequestError:
        raise
    except NotFoundError:
        raise
    except Exception as e:
        raise ServiceError(str(e))


def add_cohort_to_database(req: AddCohortToEcosystemRequest):
    try:
        db = get_mongo_db()
        from bson import ObjectId

        if req.all:
            query = {}
        else:
            # Parse object ids safely
            parsed_ids = []
            for aid in req.app_ids:
                try:
                    parsed_ids.append(ObjectId(aid))
                except:
                    pass
            query = {"_id": {"$in": parsed_ids}}

        cursor = db["incubein_applications"].find(query)

        inserted_count = 0
        for doc in cursor:
            # Decrypt name
            enc = doc.get("encrypted_fields", {})
            founder_name = decrypt_val(enc.get("name", ""))

            # Prepare startup record
            startup_record = {
                "startup_name": doc["startup_name"],
                "sector": doc["sector"],
                "founders": founder_name,
                "website": doc["website"],
                "funding_stage": doc["stage"],
                "hq_city": doc["city_state"].split(",")[0].strip() if doc["city_state"] else "Unknown",
                "incubated_at": _dt.datetime.now().strftime("%Y-%m-%d"),
                "incubator_id": "incubein_cohort",
                "confidence_score": doc["final_score"],
                "status": "Shortlisted",
                "last_updated": _dt.datetime.now().isoformat(),
                "source_url": "Cohort Excel Upload"
            }

            # Check duplicate by name
            existing = db["startups"].find_one({"startup_name": doc["startup_name"]})
            if not existing:
                # Find maximum numeric ID
                max_id = 1
                try:
                    all_ids = []
                    for st_doc in db["startups"].find({}, {"id": 1}):
                        id_val = st_doc.get("id")
                        if id_val:
                            if isinstance(id_val, int):
                                all_ids.append(id_val)
                            elif isinstance(id_val, str) and id_val.isdigit():
                                all_ids.append(int(id_val))
                    if all_ids:
                        max_id = max(all_ids) + 1
                except Exception as id_err:
                    print("Error calculating max startup id:", id_err)

                startup_record["id"] = str(max_id)
                db["startups"].insert_one(startup_record)
                inserted_count += 1

        return {"status": "success", "message": f"Successfully imported {inserted_count} startups into the ecosystem directory."}
    except Exception as e:
        raise ServiceError(str(e))


def add_cohort_to_campaigns(req: AddCohortToEcosystemRequest):
    try:
        db = get_mongo_db()
        from bson import ObjectId

        if req.all:
            query = {}
        else:
            parsed_ids = []
            for aid in req.app_ids:
                try:
                    parsed_ids.append(ObjectId(aid))
                except:
                    pass
            query = {"_id": {"$in": parsed_ids}}

        cursor = db["incubein_applications"].find(query)

        # Open translation connection
        conn = get_db_connection()
        db_cursor = conn.cursor()

        inserted_count = 0
        for doc in cursor:
            enc = doc.get("encrypted_fields", {})
            email = decrypt_val(enc.get("email", ""))

            if not email:
                continue

            # Check duplicate in outreach_leads using both email and startup_name
            db_cursor.execute("SELECT id FROM outreach_leads WHERE email = ? AND incubator_name = ?", (email, doc["startup_name"]))
            existing = db_cursor.fetchone()

            if existing:
                # Update existing lead status and lead_score
                db_cursor.execute('''
                    UPDATE outreach_leads 
                    SET status = 'Draft', lead_score = 0, incubator_id = 'incubein_cohort' 
                    WHERE email = ? AND incubator_name = ?
                ''', (email, doc["startup_name"]))
                inserted_count += 1
            else:
                # Insert new lead with all required schema columns populated
                lead_id = f"lead_{uuid.uuid4().hex[:8]}"
                db_cursor.execute('''
                    INSERT INTO outreach_leads (
                        id, incubator_id, incubator_name, email, status, lead_score, 
                        contact_count, last_contact_reason, next_action_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (lead_id, 'incubein_cohort', doc["startup_name"], email, 'Draft', 0, 0, 'None', ''))
                inserted_count += 1

        conn.commit()
        conn.close()

        return {"status": "success", "message": f"Successfully added {inserted_count} startups to the outreach campaign leads."}
    except Exception as e:
        raise ServiceError(str(e))


def clear_startup_campaigns():
    try:
        db = get_mongo_db()
        res = db["outreach_leads"].delete_many({"incubator_id": "incubein_cohort"})
        return {"status": "success", "message": f"Cleared {res.deleted_count} startup campaign leads successfully."}
    except Exception as e:
        raise ServiceError(str(e))


def clear_incubators_directory():
    try:
        db = get_mongo_db()
        res = db["incubators"].delete_many({})
        return {"status": "success", "message": f"Successfully cleared {res.deleted_count} incubators from the directory."}
    except Exception as e:
        raise ServiceError(str(e))


def clear_startups_directory():
    try:
        db = get_mongo_db()
        res = db["startups"].delete_many({})
        return {"status": "success", "message": f"Successfully cleared {res.deleted_count} startups from the directory."}
    except Exception as e:
        raise ServiceError(str(e))


def scrape_and_enrich_entity(req: ScrapeEnrichRequest):
    try:
        from .enricher import enrich_entity_data
        enriched = enrich_entity_data(
            entity_name=req.entity_name,
            entity_type=req.entity_type,
            user_city=req.city,
            user_state=req.state
        )
        return {"status": "success", "data": enriched}
    except Exception as e:
        raise ServiceError(f"Data enrichment failed: {str(e)}")


def batch_enrich_entities(req: BatchEnrichRequest):
    try:
        from .enricher import enrich_entity_data
        results = []
        for name in req.entity_names[:15]:  # Limit batch size to 15 for responsiveness
            if name.strip():
                res = enrich_entity_data(entity_name=name, entity_type=req.entity_type)
                results.append(res)
        return {"status": "success", "results": results, "count": len(results)}
    except Exception as e:
        raise ServiceError(str(e))


def add_incubator_cohort_to_db(req: AddIncubatorsToEcosystemRequest):
    try:
        db = get_mongo_db()
        from bson import ObjectId

        query = {"entity_type": "incubator"}
        if not req.all:
            parsed_ids = []
            for aid in req.app_ids:
                try: parsed_ids.append(ObjectId(aid))
                except: pass
            query["_id"] = {"$in": parsed_ids}

        cursor = db["incubein_applications"].find(query)
        inserted_count = 0

        for doc in cursor:
            inc_name = doc.get("startup_name") or doc.get("name") or "Incubator Hub"
            existing = db["incubators"].find_one({"name": inc_name})
            if not existing:
                inc_id = f"inc_{uuid.uuid4().hex[:8]}"
                enc = doc.get("encrypted_fields", {})
                contact_email = decrypt_val(enc.get("email", "")) or doc.get("email") or f"contact@{inc_name.lower().replace(' ', '')[:15]}.org"

                inc_record = {
                    "id": inc_id,
                    "name": inc_name,
                    "type": doc.get("stage") or "Academic TBI",
                    "state": doc.get("city_state", "").split(",")[-1].strip() if "," in doc.get("city_state", "") else "Maharashtra",
                    "city": doc.get("city_state", "").split(",")[0].strip() if doc.get("city_state") else "Nagpur",
                    "email": contact_email,
                    "website": doc.get("website") or f"https://www.{inc_name.lower().replace(' ', '')[:15]}.org.in",
                    "focus_areas": doc.get("sector") or "DeepTech, AgriTech, CleanTech",
                    "startup_count": 10,
                    "active_startups": 8,
                    "confidence_score": doc.get("final_score", 85),
                    "status": "resolved"
                }
                db["incubators"].insert_one(inc_record)
                inserted_count += 1

        return {"status": "success", "message": f"Successfully imported {inserted_count} incubators into Ecosystem Directory."}
    except Exception as e:
        raise ServiceError(str(e))


def get_nurture_loop_entities():
    try:
        db = get_mongo_db()
        leads_cursor = db["outreach_leads"].find({}).sort("sent_at", -1)
        active_loops = []

        now = datetime.now()

        for doc in leads_cursor:
            doc["_id"] = str(doc["_id"])
            sent_str = doc.get("sent_at")
            days_elapsed = 0
            if sent_str:
                try:
                    sent_dt = datetime.fromisoformat(sent_str.replace("Z", "+00:00"))
                    days_elapsed = (now - sent_dt).days
                except:
                    days_elapsed = 15
            else:
                days_elapsed = 5

            days_remaining = max(0, 90 - days_elapsed)

            # Retrieve milestones/meetings for this lead
            meetings = list(db["scheduled_meetings"].find({"lead_id": doc["id"]}))
            milestones = []
            for m in meetings:
                milestones.append({
                    "id": str(m["_id"]),
                    "title": m.get("subject", "Milestone Check-in"),
                    "date": m.get("meeting_date", "Upcoming"),
                    "status": m.get("status", "Scheduled"),
                    "link": m.get("meeting_link", "Google Meet")
                })

            active_loops.append({
                "lead_id": doc["id"],
                "name": doc.get("incubator_name", "Ecosystem Lead"),
                "email": doc.get("email", ""),
                "status": doc.get("status", "Draft"),
                "days_elapsed": min(days_elapsed, 90),
                "days_remaining": days_remaining,
                "loop_progress_pct": min(100, int((days_elapsed / 90.0) * 100)),
                "contact_count": doc.get("contact_count", 1),
                "milestones": milestones,
                "notes": doc.get("notes", "")
            })

        return active_loops
    except Exception as e:
        raise ServiceError(str(e))


def add_nurture_milestone(req: MilestoneRequest):
    try:
        db = get_mongo_db()
        from bson import ObjectId

        lead = db["outreach_leads"].find_one({"id": req.lead_id})
        if not lead:
            raise NotFoundError("Lead not found.")

        meeting_doc = {
            "lead_id": req.lead_id,
            "incubator_name": lead.get("incubator_name"),
            "subject": f"Day {req.milestone_day} Incubation Milestone: {req.milestone_title}",
            "meeting_date": req.meeting_date,
            "meeting_time": "11:00 AM",
            "meeting_link": req.meeting_link,
            "status": "Scheduled",
            "notes": req.notes,
            "created_at": datetime.now().isoformat()
        }
        db["scheduled_meetings"].insert_one(meeting_doc)

        # Update lead notes
        new_note = f"[Day {req.milestone_day} Milestone Scheduled] {req.milestone_title} on {req.meeting_date}"
        existing_notes = lead.get("notes") or ""
        updated_notes = f"{existing_notes}\n{new_note}".strip()

        db["outreach_leads"].update_one(
            {"id": req.lead_id},
            {"$set": {"notes": updated_notes, "next_action_date": req.meeting_date}}
        )

        return {"status": "success", "message": f"Day {req.milestone_day} milestone scheduled successfully!"}
    except NotFoundError:
        raise
    except Exception as e:
        raise ServiceError(str(e))
