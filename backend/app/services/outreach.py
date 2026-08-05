import os
import re
import json
import uuid
import threading
import time
import imaplib
import email
from email.header import decode_header
from datetime import datetime
from typing import Optional, List

from ..core import config
from ..core.database import get_db_connection
from ..core.exceptions import NotFoundError, BadRequestError
from ..schemas.outreach import (
    AddLeadRequest,
    UpdateLeadStatusRequest,
    UpdateLeadNotesRequest,
    UpdateStageRequest,
    OutreachEmailRequest,
    MassSendRequest,
    FollowupEmailRequest,
    OutreachConfig,
)
from .email import get_smtp_config, send_outreach_single, send_plain_email


def seed_outreach_leads():
    """Initializes outreach_leads DB table schema. Targeted outreach leads are added dynamically by the user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS outreach_leads (
            id TEXT PRIMARY KEY,
            incubator_id TEXT,
            incubator_name TEXT,
            email TEXT,
            status TEXT DEFAULT 'Draft',
            lead_score INTEGER DEFAULT 0,
            contact_count INTEGER DEFAULT 0,
            last_contact_reason TEXT,
            next_action_date TEXT,
            sent_at TEXT,
            nurture_start_date TEXT,
            nurture_cycle_days INTEGER DEFAULT 90,
            reply_text TEXT,
            reply_detected_at TEXT,
            intent_classification TEXT,
            meeting_link TEXT,
            meeting_scheduled_at TEXT,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()


def get_outreach_leads():
    seed_outreach_leads()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def add_outreach_lead(req: AddLeadRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already exists in campaign
    cursor.execute("SELECT COUNT(*) FROM outreach_leads WHERE incubator_id = ?", (req.incubator_id,))
    id_exists = cursor.fetchone()[0] > 0

    cursor.execute("SELECT COUNT(*) FROM outreach_leads WHERE email = ?", (req.email,))
    email_exists = cursor.fetchone()[0] > 0

    if id_exists or email_exists:
        conn.close()
        return {"status": "exists", "message": "Lead already exists in campaign leads."}

    lead_id = f"lead_{uuid.uuid4().hex[:8]}"
    cursor.execute('''
        INSERT INTO outreach_leads (id, incubator_id, incubator_name, email, status, lead_score, contact_count, last_contact_reason, next_action_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (lead_id, req.incubator_id, req.incubator_name, req.email, 'Draft', 0, 0, 'None', ''))

    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Successfully added {req.incubator_name} to campaigns.", "lead_id": lead_id}


def reset_outreach():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scheduled_meetings")
    cursor.execute("DELETE FROM outreach_leads")
    conn.commit()
    conn.close()
    seed_outreach_leads()
    return {"status": "success", "message": "Campaign data successfully reset."}


def update_lead_status(req: UpdateLeadStatusRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (req.lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        raise NotFoundError("Lead not found")
    cursor.execute("UPDATE outreach_leads SET status = ? WHERE id = ?", (req.status, req.lead_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Campaign lead status updated to {req.status}."}


def update_lead_notes(req: UpdateLeadNotesRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (req.lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        raise NotFoundError("Lead not found")
    if req.next_action_date is not None:
        cursor.execute("UPDATE outreach_leads SET notes = ?, next_action_date = ? WHERE id = ?", (req.notes, req.next_action_date, req.lead_id))
    else:
        cursor.execute("UPDATE outreach_leads SET notes = ? WHERE id = ?", (req.notes, req.lead_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Campaign lead notes updated successfully."}


def update_collaboration_stage(req: UpdateStageRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (req.lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        raise NotFoundError("Lead not found")

    if req.notes is not None:
        cursor.execute("UPDATE outreach_leads SET status = ?, notes = ? WHERE id = ?", (req.stage, req.notes, req.lead_id))
    else:
        cursor.execute("UPDATE outreach_leads SET status = ? WHERE id = ?", (req.stage, req.lead_id))

    conn.commit()
    conn.close()


def clean_email_reply(text: str) -> str:
    if not text:
        return ""
    lines = []
    thread_indicators = [
        "on ", "wrote:", "-----original message-----", "from:", "to:", "sent:"
    ]
    for line in text.splitlines():
        line_strip = line.strip()
        # Skip quoted lines in email threads
        if line_strip.startswith(">"):
            continue
        # Stop processing if we hit the beginning of the reply/forward thread history
        line_lower = line_strip.lower()
        if any(indicator in line_lower for indicator in thread_indicators) and ("@" in line_lower or "," in line_lower or ":" in line_lower):
            break
        lines.append(line)
    return "\n".join(lines).strip()


def get_lead_timeline(lead_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (lead_id,))
    lead_row = cursor.fetchone()
    if not lead_row:
        conn.close()
        raise NotFoundError("Lead not found")

    lead = dict(lead_row)

    cursor.execute("SELECT * FROM scheduled_meetings WHERE lead_id = ? OR incubator_name = ?", (lead_id, lead["incubator_name"]))
    meetings = [dict(r) for r in cursor.fetchall()]

    conn.close()

    timeline = []

    timeline.append({
        "type": "ranked",
        "title": "📌 Indexed & Evaluated",
        "timestamp": lead.get("sent_at") or "Initial Setup",
        "details": f"Entity {lead['incubator_name']} indexed in ecosystem intelligence platform."
    })

    if lead.get("sent_at") or lead.get("contact_count", 0) > 0:
        cnt = lead.get("contact_count", 1)
        timeline.append({
            "type": "outreach",
            "title": f"📤 Outreach Email Dispatched (Contact Count: {cnt})",
            "timestamp": lead.get("sent_at") or "Recently",
            "details": f"Outreach email campaign sent to {lead['email']}."
        })

    if lead.get("followup_count", 0) > 0:
        timeline.append({
            "type": "followup",
            "title": f"🔄 Follow-up Dispatched (#{lead['followup_count']})",
            "timestamp": lead.get("last_followup_at") or "Recently",
            "details": f"Automated follow-up email sent to {lead['email']}."
        })

    if lead.get("reply_detected_at") or lead.get("reply_text"):
        raw_reply = lead.get("reply_text") or ""
        clean_text = clean_email_reply(raw_reply) if raw_reply else "Entity responded to outreach email."
        if not clean_text:
            clean_text = raw_reply

        quoted_history = ""
        if raw_reply and clean_text and len(raw_reply) > len(clean_text):
            quoted_history = raw_reply[len(clean_text):].strip()

        intent = lead.get("intent_classification")
        lead_score = lead.get("lead_score") or 50

        raw_lower = raw_reply.lower()
        if not intent or intent == "Neutral":
            if any(k in raw_lower for k in ["meet", "schedule", "call", "available", "zoom", "google meet", "calendar"]):
                intent = "Meeting Requested"
                lead_score = max(lead_score, 90)
                sentiment = "Highly Interested"
            elif any(k in raw_lower for k in ["interested", "collaborate", "partnership", "mou", "yes"]):
                intent = "Positive Response"
                lead_score = max(lead_score, 75)
                sentiment = "Interested"
            elif any(k in raw_lower for k in ["not interested", "no thanks", "unsubscribe"]):
                intent = "Not Interested"
                lead_score = 10
                sentiment = "Uninterested"
            else:
                intent = "Information Received"
                sentiment = "Neutral"
        else:
            sentiment = "Highly Interested" if lead_score >= 80 else "Interested" if lead_score >= 60 else "Neutral"

        timeline.append({
            "type": "reply",
            "title": "📩 Email Reply Received & Analyzed",
            "timestamp": lead.get("reply_detected_at") or "Recently",
            "details": clean_text,
            "clean_text": clean_text,
            "quoted_history": quoted_history,
            "intent": intent,
            "score": lead_score,
            "sentiment": sentiment
        })

    for m in meetings:
        timeline.append({
            "type": "meeting",
            "title": f"📅 Meeting Booked ({m.get('status', 'Scheduled')})",
            "timestamp": f"{m.get('meeting_date', '')} {m.get('meeting_time', '')}".strip() or "Scheduled",
            "details": f"Subject: {m.get('subject', 'Strategic Meeting')} | Meeting Link: {m.get('meeting_link') or 'Google Meet'}"
        })

    if lead.get("notes"):
        timeline.append({
            "type": "notes",
            "title": "📝 Progress Notes & Collected Info",
            "timestamp": "Latest Notes",
            "details": lead.get("notes")
        })

    if lead.get("status") in ["MOUs", "Incubated", "TBI Partnership"]:
        timeline.append({
            "type": "collaboration",
            "title": f"🤝 Collaboration Stage: {lead['status']}",
            "timestamp": "Active",
            "details": f"Entity active in stage {lead['status']}."
        })

    return {
        "lead": lead,
        "meetings": meetings,
        "timeline": timeline
    }


def trigger_outreach_email(req: OutreachEmailRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (req.lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        raise NotFoundError("Lead not found")

    smtp_cfg = get_smtp_config(req.mail_account)
    sender_email = smtp_cfg["sender_email"]

    lead_name = lead["incubator_name"]
    is_startup = lead["incubator_id"] == "incubein_cohort"
    if is_startup:
        default_subject = "Introduction to Incubein Foundation"
        default_body = f"""Hello {lead_name},

Greetings from Incubein Foundation RTM Nagpur University.

We came across your startup and were impressed by the work you're building. At Incubein Foundation, we work closely with early-stage and growth-stage startups by providing the right ecosystem, mentorship, and resources to help them scale.

We would love to learn more about {lead_name}, understand your current challenges and growth plans, and explore how Incubein Foundation can support your journey.

If you're available, we'd be happy to schedule a 30-minute Google Meet at your convenience.

Please let us know a suitable date and time that works for you, and we'll be happy to coordinate.

Warm regards,

Team Incubein Foundation
Incubein Foundation - RTMNU Business Incubation Centre
Nagpur, Maharashtra
Email: teamincubein@gmail.com
Website: www.incubein.com"""
    else:
        default_subject = "Introduction to Incubein Foundation"
        default_body = f"""Hello {lead_name},

Greetings from Incubein Foundation RTM Nagpur University.

We came across your incubation centre and were impressed by the impactful work you're doing for the startup ecosystem. We would love to explore a potential Strategic Cooperation and Academic Collaboration between Incubein Foundation and {lead_name}.

If you're available, we'd be happy to schedule a 30-minute Google Meet at your convenience.

Please let us know a suitable date and time that works for you, and we'll be happy to coordinate.

Warm regards,

Team Incubein Foundation
Incubein Foundation - RTMNU Business Incubation Centre
Nagpur, Maharashtra
Email: teamincubein@gmail.com
Website: www.incubein.com"""

    subject = req.subject or default_subject
    body_text = req.body or default_body

    email_sent_successfully = send_outreach_single(
        smtp_cfg, sender_email, lead["email"], subject, body_text, cc=req.cc
    )

    cursor.execute(
        "UPDATE outreach_leads SET status = 'Sent', sent_at = ?, contact_count = coalesce(contact_count, 0) + 1, last_contact_reason = ? WHERE id = ?",
        (datetime.now().isoformat(), subject or "Outreach Email", req.lead_id)
    )
    conn.commit()
    conn.close()
    msg_status = "Real email sent via SMTP" if email_sent_successfully else "SMTP not configured, simulated sending"
    return {"status": "success", "message": f"Outreach email campaign successfully triggered for {lead['incubator_name']} ({msg_status})."}


def send_followup_email(lead_id: str, lead_name: str, lead_email: str, followup_number: int):
    smtp_cfg = get_smtp_config()
    sender_email = smtp_cfg["sender_email"]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT incubator_id FROM outreach_leads WHERE id = ?", (lead_id,))
    lead_row = cursor.fetchone()
    conn.close()

    if lead_row and lead_row["incubator_id"] == "incubein_cohort":
        subject = f"Following up: Introduction to Incubein Foundation – {lead_name} (Follow-up #{followup_number})"
        body_text = f"""Dear {lead_name},

Greetings from Incubein Foundation RTM Nagpur University.

We are following up on our previous email regarding our invitation to explore how Incubein Foundation can support your startup journey.

We remain very interested in connecting with {lead_name} and would love to schedule a 30-minute Google Meet at your convenience.

Please let us know a suitable date and time that works for you, and we'll be happy to coordinate.

Warm regards,

Team Incubein Foundation
Incubein Foundation - RTMNU Business Incubation Centre
Nagpur, Maharashtra
Email: teamincubein@gmail.com
Website: www.incubein.com
(Follow-up Reference #{followup_number})
"""
    else:
        subject = f"Following up: Introduction to Incubein Foundation – {lead_name} (Follow-up #{followup_number})"
        body_text = f"""Dear {lead_name},

Greetings from Incubein Foundation RTM Nagpur University.

We are following up on our previous email regarding a potential Strategic Cooperation and Academic Collaboration between Incubein Foundation and {lead_name}.

We remain keen to explore a 30-minute Google Meet at your convenience to discuss how we can create mutual value for our respective ecosystems.

Please let us know a suitable date and time, and we'll be happy to coordinate.

Warm regards,

Team Incubein Foundation
Incubein Foundation - RTMNU Business Incubation Centre
Nagpur, Maharashtra
Email: teamincubein@gmail.com
Website: www.incubein.com
(Follow-up Reference #{followup_number})
"""

    email_sent_successfully = send_plain_email(
        smtp_cfg, sender_email, lead_email, subject, body_text, from_display="Incubein Outreach"
    )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE outreach_leads 
        SET status = 'Follow-up Sent', 
            followup_count = ?, 
            last_followup_at = ? 
        WHERE id = ?
    ''', (followup_number, datetime.now().isoformat(), lead_id))
    conn.commit()
    conn.close()

    return email_sent_successfully


def trigger_mass_send(req: MassSendRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Select all Draft leads of the target type
    if req.target_type == "startups":
        cursor.execute("SELECT * FROM outreach_leads WHERE status = 'Draft' AND incubator_id = 'incubein_cohort'")
    else:
        cursor.execute("SELECT * FROM outreach_leads WHERE status = 'Draft' AND incubator_id != 'incubein_cohort'")

    leads = [dict(row) for row in cursor.fetchall()]

    if not leads:
        conn.close()
        return {"status": "success", "message": f"No draft leads found for {req.target_type}.", "sent_count": 0}

    smtp_cfg = get_smtp_config(req.mail_account)
    sender_email = smtp_cfg["sender_email"]
    is_smtp_ready = smtp_cfg["is_smtp_ready"]

    sent_count = 0
    simulated_count = 0

    for lead in leads:
        # Determine subject and body (with template interpolation if it's startups)
        subject_to_send = req.subject
        body_to_send = req.body

        # If subject/body is not provided, use default
        if req.target_type == "startups" and not subject_to_send:
            subject_to_send = f"Introduction to Incubein Foundation"
            body_to_send = f"Hello {lead['incubator_name']},\n\nGreetings from Incubein Foundation RTM Nagpur University.\n\nWe came across your startup and were impressed by the work you're building. At Incubein Foundation, we work closely with early-stage and growth-stage startups by providing the right ecosystem, mentorship, and resources to help them scale.\n\nWe would love to learn more about {lead['incubator_name']}, understand your current challenges and growth plans, and explore how Incubein Foundation can support your journey.\n\nIf you're available, we'd be happy to schedule a 30-minute Google Meet at your convenience.\n\nPlease let us know a suitable date and time that works for you, and we'll be happy to coordinate.\n\nWarm regards,\n\nTeam Incubein Foundation\nIncubein Foundation - RTMNU Business Incubation Centre\nNagpur, Maharashtra\nEmail: teamincubein@gmail.com\nWebsite: www.incubein.com"
        elif not subject_to_send:
            subject_to_send = f"Introduction to Incubein Foundation"
            body_to_send = f"Hello {lead['incubator_name']},\n\nGreetings from Incubein Foundation RTM Nagpur University.\n\nWe came across your incubation centre and were impressed by the impactful work you're doing for the startup ecosystem. We would love to explore a potential Strategic Cooperation and Academic Collaboration between Incubein Foundation and {lead['incubator_name']}.\n\nIf you're available, we'd be happy to schedule a 30-minute Google Meet at your convenience.\n\nPlease let us know a suitable date and time that works for you, and we'll be happy to coordinate.\n\nWarm regards,\n\nTeam Incubein Foundation\nIncubein Foundation - RTMNU Business Incubation Centre\nNagpur, Maharashtra\nEmail: teamincubein@gmail.com\nWebsite: www.incubein.com"

        # Interpolate name placeholders if present
        if body_to_send:
            body_to_send = body_to_send.replace("{StartupName}", lead["incubator_name"]).replace("{IncubatorName}", lead["incubator_name"])
        if subject_to_send:
            subject_to_send = subject_to_send.replace("{StartupName}", lead["incubator_name"]).replace("{IncubatorName}", lead["incubator_name"])

        email_sent = False
        if is_smtp_ready:
            email_sent = send_outreach_single(
                smtp_cfg, sender_email, lead["email"], subject_to_send, body_to_send, cc=req.cc
            )
            if email_sent:
                sent_count += 1
            else:
                simulated_count += 1
        else:
            simulated_count += 1

        # Update lead in DB
        cursor.execute(
            "UPDATE outreach_leads SET status = 'Sent', sent_at = ?, contact_count = coalesce(contact_count, 0) + 1, last_contact_reason = ? WHERE id = ?",
            (datetime.now().isoformat(), subject_to_send or "Mass Outreach Email", lead["id"])
        )

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "sent_count": sent_count,
        "simulated_count": simulated_count,
        "message": f"Successfully processed mass send for {len(leads)} {req.target_type} ({sent_count} real emails, {simulated_count} simulated)."
    }


def send_followup_single(req: FollowupEmailRequest):
    if config.FOLLOWUPS_PAUSED:
        raise BadRequestError("Follow-up emails are permanently paused. Resume follow-ups in the Outreach Automation controls to proceed.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (req.lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        raise NotFoundError("Lead not found")

    lead = dict(lead)
    current_count = lead.get("followup_count", 0) or 0

    if lead["status"] not in ["Sent", "Follow-up Sent"]:
        conn.close()
        raise BadRequestError(f"Lead status is '{lead['status']}'. Can only follow up on Sent or Follow-up Sent leads.")

    next_count = current_count + 1
    if next_count > 2:
        conn.close()
        raise BadRequestError("Maximum follow-ups (2) already reached for this lead.")

    conn.close()

    email_sent = send_followup_email(lead["id"], lead["incubator_name"], lead["email"], next_count)
    msg_status = "Real email sent via SMTP" if email_sent else "SMTP not configured, simulated sending"

    return {
        "status": "success",
        "message": f"Follow-up #{next_count} successfully triggered for {lead['incubator_name']} ({msg_status}).",
        "followup_count": next_count
    }


def send_followups():
    if config.FOLLOWUPS_PAUSED:
        return {
            "status": "paused",
            "checked_at": datetime.now().isoformat(),
            "followups_sent_count": 0,
            "dispatched": [],
            "message": "Follow-up emails are permanently paused. Resume follow-ups in the Outreach Automation controls to proceed."
        }

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM outreach_leads WHERE status IN ('Sent', 'Follow-up Sent')")
    leads = [dict(row) for row in cursor.fetchall()]

    dispatched = []
    now = datetime.now()

    for lead in leads:
        last_time_str = lead.get("last_followup_at") or lead.get("sent_at")
        if not last_time_str:
            continue

        try:
            last_time = datetime.fromisoformat(last_time_str)
            elapsed_seconds = (now - last_time).total_seconds()

            if elapsed_seconds >= config.FOLLOWUP_DELAY:
                current_count = lead.get("followup_count", 0) or 0
                next_count = current_count + 1

                if next_count <= 2:
                    email_sent = send_followup_email(lead["id"], lead["incubator_name"], lead["email"], next_count)
                    msg_status = "SMTP Sent" if email_sent else "Simulated"
                    dispatched.append({
                        "id": lead["id"],
                        "incubator_name": lead["incubator_name"],
                        "email": lead["email"],
                        "followup_number": next_count,
                        "status": msg_status
                    })
        except Exception as e:
            print(f"Error parsing date/sending follow-up for lead {lead['email']}: {e}")

    conn.close()
    return {
        "status": "success",
        "checked_at": now.isoformat(),
        "followups_sent_count": len(dispatched),
        "dispatched": dispatched
    }


def check_and_send_followups_sync():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outreach_leads WHERE status IN ('Sent', 'Follow-up Sent')")
    leads = [dict(row) for row in cursor.fetchall()]

    now = datetime.now()
    for lead in leads:
        last_time_str = lead.get("last_followup_at") or lead.get("sent_at")
        if not last_time_str:
            continue

        try:
            last_time = datetime.fromisoformat(last_time_str)
            elapsed_seconds = (now - last_time).total_seconds()
            if elapsed_seconds >= config.FOLLOWUP_DELAY:
                current_count = lead.get("followup_count", 0) or 0
                next_count = current_count + 1
                if next_count <= 2:
                    print(f"Background daemon: Triggering follow-up #{next_count} for {lead['incubator_name']} ({lead['email']})")
                    send_followup_email(lead["id"], lead["incubator_name"], lead["email"], next_count)
        except Exception as e:
            print(f"Background daemon error sending follow-up: {e}")

    conn.close()


def process_reply(lead_id: str, reply_text: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM outreach_leads WHERE id = ?", (lead_id,))
    lead = cursor.fetchone()
    if not lead:
        conn.close()
        return None

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    api_key = os.environ.get("GEMINI_API_KEY")
    intent = "Neutral"
    score = 50
    summary = "Acknowledge receipt and waiting for more context."
    sentiment = "Neutral"
    urgency = "Low"
    reason_code = "Other"

    analyzed = False
    cleaned_reply = clean_email_reply(reply_text)

    # Try OpenRouter first
    if openrouter_key and "your_openrouter" not in openrouter_key:
        try:
            import requests
            prompt = f"""
            You are the AI Intent Classifier and Sentiment Analyzer for the Indian Startup Ecosystem Outreach System.
            Analyze the following email reply from an incubator and output a JSON object containing:
            1. "intent": One of "Positive", "Neutral", "Negative", "Information Request"
            2. "score": An interest score from 0 to 100 representing how eager they are to collaborate/arrange a meeting. (e.g. "we would love to meet" = 90+, "tell me more" = 60-79, "no thanks" = <30).
            3. "summary": A 1-sentence summary of their response.
            4. "sentiment": One of "Highly Interested", "Tentative", "Uninterested", "Requires Clarification"
            5. "urgency": One of "High", "Medium", "Low"
            6. "reason_code": One of "Wants to meet", "Wants more details", "Too busy/Not now", "Wrong contact person", "Not interested", "Other"

            Reply text: "{cleaned_reply}"

            Output ONLY valid JSON.
            """

            # We can try a few models to be robust
            models_to_try = [
                "google/gemini-2.5-flash",
                "meta-llama/llama-3-8b-instruct:free",
                "google/gemma-2-9b-it:free"
            ]

            for model in models_to_try:
                try:
                    response = requests.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {openrouter_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.1
                        },
                        timeout=12
                    )
                    if response.status_code == 200:
                        result_data = response.json()
                        result_text = result_data["choices"][0]["message"]["content"].strip()
                        if "```json" in result_text:
                            result_text = result_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in result_text:
                            result_text = result_text.split("```")[1].split("```")[0].strip()

                        res = json.loads(result_text)
                        intent = res.get("intent", intent)
                        score = int(res.get("score", score))
                        summary = res.get("summary", summary)
                        sentiment = res.get("sentiment", sentiment)
                        urgency = res.get("urgency", urgency)
                        reason_code = res.get("reason_code", reason_code)
                        analyzed = True
                        print(f"OpenRouter analyzed reply successfully using {model}.")
                        break
                except Exception as model_err:
                    print(f"OpenRouter model {model} failed: {model_err}")
        except Exception as e:
            print("OpenRouter classification failed:", e)

    # Try Gemini fallback if OpenRouter did not succeed
    if not analyzed and api_key and "your_gemini" not in api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')

            prompt = f"""
            You are the AI Intent Classifier and Sentiment Analyzer for the Indian Startup Ecosystem Outreach System.
            Analyze the following email reply from an incubator and output a JSON object containing:
            1. "intent": One of "Positive", "Neutral", "Negative", "Information Request"
            2. "score": An interest score from 0 to 100 representing how eager they are to collaborate/arrange a meeting. (e.g. "we would love to meet" = 90+, "tell me more" = 60-79, "no thanks" = <30).
            3. "summary": A 1-sentence summary of their response.
            4. "sentiment": One of "Highly Interested", "Tentative", "Uninterested", "Requires Clarification"
            5. "urgency": One of "High", "Medium", "Low"
            6. "reason_code": One of "Wants to meet", "Wants more details", "Too busy/Not now", "Wrong contact person", "Not interested", "Other"

            Reply text: "{cleaned_reply}"

            Output ONLY valid JSON.
            """
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            res = json.loads(result_text)
            intent = res.get("intent", intent)
            score = int(res.get("score", score))
            summary = res.get("summary", summary)
            sentiment = res.get("sentiment", sentiment)
            urgency = res.get("urgency", urgency)
            reason_code = res.get("reason_code", reason_code)
            analyzed = True
        except Exception as e:
            print("Gemini analysis error:", e)

    # Local fallback rules
    if not analyzed or score == 50:
        reply_lower = cleaned_reply.lower()

        negative_keywords = [
            r"not\s+interested",
            r"not\s+intrested",
            r"uninterested",
            r"no\s+interest",
            r"no\s+thanks",
            r"\bno\b",
            r"decline",
            r"sorry",
            r"cannot",
            r"cancel",
            r"busy",
            r"unable",
            r"not\s+looking"
        ]

        positive_keywords = [
            r"love\s+to",
            r"excited",
            r"schedule",
            r"meeting",
            r"meet",
            r"calendar",
            r"join",
            r"interested",
            r"sure",
            r"definitely",
            r"yes",
            r"great",
            r"mou"
        ]

        info_keywords = [
            r"what",
            r"how",
            r"information",
            r"details",
            r"docs",
            r"document",
            r"questions",
            r"send\s+me"
        ]

        if any(re.search(pat, reply_lower) for pat in negative_keywords):
            intent = "Negative"
            score = 15
            summary = "Declined the collaboration proposal."
            sentiment = "Uninterested"
            urgency = "Low"
            reason_code = "Not interested"
        elif any(re.search(pat, reply_lower) for pat in positive_keywords):
            intent = "Positive"
            score = 90
            summary = "Expressed strong interest and requested to schedule a meeting."
            sentiment = "Highly Interested"
            urgency = "High"
            reason_code = "Wants to meet"
        elif any(re.search(pat, reply_lower) for pat in info_keywords):
            intent = "Information Request"
            score = 70
            summary = "Requested additional information or documentation."
            sentiment = "Tentative"
            urgency = "Medium"
            reason_code = "Wants more details"

    meeting_details = None
    meeting_link = None
    meeting_scheduled_at = None

    if score < 30:
        new_status = 'Not Interested'
    else:
        new_status = 'Replied'

    cursor.execute('''
        UPDATE outreach_leads 
        SET status = ?, 
            reply_text = ?, 
            reply_detected_at = ?, 
            intent_classification = ?, 
            lead_score = ?,
            meeting_link = ?,
            meeting_scheduled_at = ?,
            reply_sentiment = ?,
            reply_urgency = ?,
            reply_reason = ?
        WHERE id = ?
    ''', (
        new_status,
        reply_text,
        datetime.now().isoformat(),
        intent,
        score,
        meeting_link if meeting_link else lead["meeting_link"],
        meeting_scheduled_at if meeting_scheduled_at else lead["meeting_scheduled_at"],
        sentiment,
        urgency,
        reason_code,
        lead_id
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "lead_status": new_status,
        "intent": intent,
        "score": score,
        "summary": summary,
        "sentiment": sentiment,
        "urgency": urgency,
        "reason_code": reason_code,
        "meeting": meeting_details
    }


def process_outreach_reply(req):
    res = process_reply(req.lead_id, req.reply_text)
    if not res:
        raise NotFoundError("Lead not found")
    return res


def extract_email_address(from_header):
    if not from_header:
        return ""
    match = re.search(r'<([^>]+)>', from_header)
    if match:
        return match.group(1).strip().lower()
    # Remove surrounding quotes if any
    return from_header.strip().strip('"').strip("'").lower()


def check_imap_replies_sync():
    imap_host = os.environ.get("IMAP_HOST")
    imap_port = os.environ.get("IMAP_PORT", "993")
    imap_user = os.environ.get("IMAP_USER")
    imap_pass = os.environ.get("IMAP_PASS")

    if imap_user:
        imap_user = imap_user.strip().strip('"').strip("'")
    if imap_pass:
        imap_pass = imap_pass.strip().strip('"').strip("'")

    if not (imap_host and imap_user and imap_pass) or "your_email" in imap_user:
        print("IMAP parameters not configured or using placeholders. Skipping IMAP scan.")
        return []

    processed_replies = []
    try:
        print(f"Connecting to IMAP server {imap_host}:{imap_port} for user {imap_user}...")
        mail = imaplib.IMAP4_SSL(imap_host, int(imap_port))
        mail.login(imap_user, imap_pass)
        mail.select("inbox")

        # Search ALL messages in the inbox (Seen and Unseen)
        status, response = mail.search(None, "ALL")
        if status != "OK":
            mail.logout()
            print("IMAP search failed.")
            return []

        mail_ids = response[0].split()
        if not mail_ids:
            mail.logout()
            print("Inbox is empty.")
            return []

        # Inspect the last 40 messages to find replies
        mail_ids = mail_ids[-40:]
        print(f"IMAP connection successful. Scanning the last {len(mail_ids)} messages in Inbox...")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get active leads email map that are currently waiting for a reply
        cursor.execute("SELECT id, email, status, incubator_name, sent_at FROM outreach_leads WHERE status IN ('Sent', 'Follow-up Sent')")
        leads = {row["email"].lower().strip(): row for row in cursor.fetchall()}

        print("Active leads waiting for replies (Sent/Follow-up status):", list(leads.keys()))

        for m_id in reversed(mail_ids):  # Scan from newest to oldest
            if len(leads) == 0:
                print("All pending outreach replies have been detected and processed. Stopping search early.")
                break

            try:
                status, msg_data = mail.fetch(m_id, "(RFC822)")
                if status != "OK":
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                from_header = msg.get("From", "")
                from_email = extract_email_address(from_header)

                print(f"Checking message From: {from_header} (parsed: {from_email})")

                if from_email in leads:
                    lead = leads[from_email]

                    # Check if email is received after outreach email sent time
                    msg_date_str = msg.get("Date")
                    if msg_date_str:
                        try:
                            import email.utils
                            msg_date = email.utils.parsedate_to_datetime(msg_date_str)
                            msg_date_local = msg_date.astimezone().replace(tzinfo=None)

                            sent_at_str = lead["sent_at"]
                            if sent_at_str:
                                sent_at_dt = datetime.fromisoformat(sent_at_str)
                                if msg_date_local < sent_at_dt:
                                    print(f"Skipping email from {from_email} as it was received at {msg_date_local} (before outreach email sent at {sent_at_dt})")
                                    continue
                        except Exception as date_err:
                            print(f"Error parsing date for message from {from_email}: {date_err}")

                    print(f"Match found for Sent lead: {lead['incubator_name']} ({from_email})!")

                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition"))
                            if content_type == "text/plain" and "attachment" not in content_disposition:
                                payload = part.get_payload(decode=True)
                                body = payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                                break
                    else:
                        payload = msg.get_payload(decode=True)
                        body = payload.decode(msg.get_content_charset() or "utf-8", errors="ignore")

                    res = process_reply(lead["id"], body)
                    if res:
                        print(f"Successfully processed reply from {from_email}. New status: {res['lead_status']}")
                        processed_replies.append({
                            "incubator_name": lead["incubator_name"],
                            "email": from_email,
                            "reply_text": body,
                            "intent": res["intent"],
                            "score": res["score"],
                            "status": res["lead_status"]
                        })

                        # Remove from the temporary leads dictionary so we don't process older emails from the same sender in this run
                        del leads[from_email]

                    # Mark Seen (optional since it was already scanned, but keeps inbox clean)
                    mail.store(m_id, "+FLAGS", "\\Seen")
            except Exception as item_err:
                print(f"Error reading message ID {m_id}: {item_err}")

        conn.close()
        mail.close()
        mail.logout()
    except Exception as e:
        print("IMAP sync exception:", e)

    return processed_replies


def get_outreach_config():
    return {
        "sync_interval": config.IMAP_SYNC_INTERVAL,
        "followup_delay": config.FOLLOWUP_DELAY,
        "scanning_paused": config.SCANNING_PAUSED,
        "followups_paused": config.FOLLOWUPS_PAUSED,
    }


def update_outreach_config(cfg: OutreachConfig):
    config.IMAP_SYNC_INTERVAL = cfg.sync_interval
    if cfg.followup_delay is not None:
        config.FOLLOWUP_DELAY = cfg.followup_delay
    if cfg.scanning_paused is not None:
        config.SCANNING_PAUSED = cfg.scanning_paused
    if cfg.followups_paused is not None:
        config.FOLLOWUPS_PAUSED = cfg.followups_paused
    print(f"Updated outreach config: IMAP sync={config.IMAP_SYNC_INTERVAL}s, followup delay={config.FOLLOWUP_DELAY}s, scanning_paused={config.SCANNING_PAUSED}, followups_paused={config.FOLLOWUPS_PAUSED}")
    return get_outreach_config()


def trigger_check_replies():
    if config.SCANNING_PAUSED:
        return {"status": "paused", "checked_at": datetime.now().isoformat(), "new_replies": [], "message": "Inbox scanning is permanently paused. Resume scanning in the Outreach Automation controls to proceed."}
    replies = check_imap_replies_sync()
    return {"status": "success", "checked_at": datetime.now().isoformat(), "new_replies": replies}


def register_mou_recipient(recipient_email: str, incubator_name: str):
    """Registers an MOU recipient as an outreach lead (called before dispatching the MOU email)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM outreach_leads WHERE email = ?", (recipient_email,))
    row = cursor.fetchone()
    if row:
        lead_id = row["id"]
        cursor.execute(
            "UPDATE outreach_leads SET status = 'MOUs', sent_at = ?, reply_text = NULL, reply_detected_at = NULL, intent_classification = NULL, lead_score = 0, meeting_link = NULL, meeting_scheduled_at = NULL WHERE id = ?",
            (datetime.now().isoformat(), lead_id)
        )
    else:
        lead_id = f"lead_{uuid.uuid4().hex[:8]}"
        cursor.execute('''
            INSERT INTO outreach_leads (
                id, incubator_id, incubator_name, email, status, sent_at, lead_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (lead_id, "inc_mou_" + uuid.uuid4().hex[:4], incubator_name, recipient_email, "MOUs", datetime.now().isoformat(), 0))
    conn.commit()
    conn.close()


# Start periodic background email reply checker daemon thread
def start_imap_checking_loop():
    def loop():
        while True:
            try:
                if config.IMAP_SYNC_INTERVAL > 0:
                    if not config.SCANNING_PAUSED:
                        check_imap_replies_sync()
                    else:
                        print("[Background] Inbox scanning paused; skipping IMAP check cycle.")
                    if not config.FOLLOWUPS_PAUSED:
                        check_and_send_followups_sync()
                    else:
                        print("[Background] Follow-ups paused; skipping follow-up dispatch cycle.")
            except Exception as e:
                print("IMAP background checker loop error:", e)

            sleep_time = max(5, config.IMAP_SYNC_INTERVAL) if config.IMAP_SYNC_INTERVAL > 0 else 5
            time.sleep(sleep_time)

    t = threading.Thread(target=loop, daemon=True)
    t.start()
