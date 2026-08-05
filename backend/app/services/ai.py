import os
import json

from ..core.database import get_db_connection
from ..schemas.ai import ChatRequest


def get_ai_models():
    import requests
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return []
    try:
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10
        )
        if response.status_code != 200:
            return []
        models = response.json().get("data", [])
        free_models = [m["id"] for m in models if ":free" in m["id"]]
        return free_models
    except Exception as e:
        print("Error fetching OpenRouter models:", e)
        return []


def chat_assistant(req: ChatRequest):
    import re
    import google.generativeai as genai

    query = req.message.strip()

    # 1. RAG Context Extraction: Match relevant records in SQLite
    conn = get_db_connection()
    cursor = conn.cursor()

    sectors = [
        "ai", "ml", "machine learning", "tourism", "wearables", "analytics",
        "agritech", "agriculture", "biotech", "biotechnology", "health",
        "healthtech", "healthcare", "medtech", "manufacturing", "agribusiness",
        "biomedical", "engineering", "food", "renewable energy", "energy",
        "basic science", "sciences", "iot", "chemical", "pharma", "materials",
        "dairy", "livestock", "digital tech", "digital technologies",
        "digital technology", "empowerment", "sustainability", "food processing",
        "food tech", "ict", "biopharma", "it", "electronics", "industry 4.0",
        "iomt", "circular economy", "life sciences", "robotics", "media tech",
        "enterprise ai", "smart city", "waste processing", "assistive tech",
        "women centric", "deeptech", "saas", "web3", "fintech", "edtech",
        "climatetech", "spacetech", "defencetech"
    ]
    matched_sectors = [s for s in sectors if s in query.lower()]

    states = [
        "maharashtra", "tamil nadu", "karnataka", "delhi", "gujarat",
        "andhra pradesh", "telangana", "punjab", "rajasthan", "uttar pradesh",
        "west bengal", "kerala", "madhya pradesh", "chhattisgarh", "odisha",
        "assam", "bihar", "haryana", "himachal pradesh", "jammu", "kashmir",
        "uttarakhand", "goa", "meghalaya", "sikkim", "tripura"
    ]
    matched_states = []
    for s in states:
        if s in query.lower():
            matched_states.append(s)

    cities = [
        "mumbai", "chennai", "bengaluru", "bangalore", "delhi", "pune",
        "ahmedabad", "noida", "gurgaon", "gurugram", "hyderabad", "kolkata",
        "guntur", "visakhapatnam", "silchar", "patna", "bilaspur", "bhilai",
        "rajkot", "solan", "srinagar", "jammu", "mysore", "indore", "kolhapur",
        "amravati", "ludhiana", "salem", "coimbatore", "prayagraj", "kanpur",
        "dehradun", "jaipur", "guwahati", "gautam buddha nagar", "lucknow",
        "agartala", "aligarh", "amethi", "awantipora", "bathinda", "bhilwara",
        "bidar", "chhindwara", "cuttack", "ghaziabad", "greater noida",
        "khurda", "kishangarh", "kottayam", "kovilpatti", "mathura", "nagpur",
        "tumakuru", "vadlamudi", "vijayapura"
    ]
    matched_cities = []
    for c in cities:
        if c in query.lower():
            matched_cities.append(c)

    sql = "SELECT id, name, city, state, email, website, focus_areas, source_url FROM incubators WHERE 1=1"
    params = []

    if matched_states:
        state_clauses = []
        for s in matched_states:
            state_clauses.append("state LIKE ?")
            params.append(f"%{s}%")
        sql += f" AND ({' OR '.join(state_clauses)})"

    if matched_cities:
        city_clauses = []
        for c in matched_cities:
            if c == "bangalore":
                city_clauses.extend(["city LIKE ?", "city LIKE ?"])
                params.extend(["%bangalore%", "%bengaluru%"])
            else:
                city_clauses.append("city LIKE ?")
                params.append(f"%{c}%")
        sql += f" AND ({' OR '.join(city_clauses)})"

    if matched_sectors:
        sector_clauses = []
        for sec in matched_sectors:
            sector_clauses.append("focus_areas LIKE ?")
            params.append(f"%{sec}%")
        sql += f" AND ({' OR '.join(sector_clauses)})"

    common_short_names = ["sine", "nsrcel", "ciie", "iit", "iim", "nit", "bits", "maker village", "forge", "tihan", "kiit", "gusec", "ccmb", "c-camp", "incubimn", "imn incubation", "nagpur university"]
    matched_shorts = [sn for sn in common_short_names if sn in query.lower()]
    if matched_shorts:
        name_clauses = []
        for ns in matched_shorts:
            name_clauses.append("name LIKE ?")
            params.append(f"%{ns}%")
        sql += f" AND ({' OR '.join(name_clauses)})"

    sql += " LIMIT 15"

    has_filters = bool(matched_states or matched_cities or matched_sectors or matched_shorts)

    cursor.execute(sql, params)
    rows = [dict(r) for r in cursor.fetchall()]

    no_matches_found = False
    if not rows:
        if has_filters:
            no_matches_found = True
        else:
            cursor.execute("SELECT id, name, city, state, email, website, focus_areas, source_url FROM incubators ORDER BY name LIMIT 10")
            rows = [dict(r) for r in cursor.fetchall()]

    conn.close()

    if no_matches_found:
        context_str = "DATABASE QUERY RESULT: No records matching the user's specific search terms (city, state, sectors, or names) were found in the database."
    else:
        context_items = []
        for r in rows:
            focus = ""
            if r["focus_areas"]:
                try:
                    focus = ", ".join(json.loads(r["focus_areas"]))
                except:
                    focus = r["focus_areas"]
            item = f"- Name: {r['name']}\n  Location: {r['city']}, {r['state']}\n  Sectors: {focus}\n  Website: {r['website'] or 'N/A'}\n  Email: {r['email'] or 'N/A'}\n  Funding Source: {r['source_url'] or 'N/A'}"
            context_items.append(item)
        context_str = "\n\n".join(context_items)

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    if openrouter_key:
        import requests
        import random
        import time

        # 1. Fetch available free models
        free_models = []
        try:
            models_response = requests.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {openrouter_key}"},
                timeout=10
            )
            if models_response.status_code == 200:
                models_data = models_response.json().get("data", [])
                free_models = [m["id"] for m in models_data if ":free" in m["id"]]
        except Exception as e:
            print("Failed to fetch OpenRouter free models:", e)

        if free_models:
            # Prioritize selected model
            selected_model = req.model
            if selected_model and selected_model in free_models:
                free_models.remove(selected_model)
                free_models.insert(0, selected_model)
            else:
                # Default preference models
                pref_models = [m for m in free_models if "llama-3" in m or "mistral" in m]
                for pm in reversed(pref_models):
                    if pm in free_models:
                        free_models.remove(pm)
                        free_models.insert(0, pm)

            # Shuffle remaining models
            first = free_models[0]
            rest = free_models[1:]
            random.shuffle(rest)
            models_to_try = [first] + rest

            system_prompt = f"""
You are the AI Assistant for the Indian Startup Ecosystem Intelligence Portal.

Strict Instruction on Avoiding Hallucinations:
1. You must answer queries using ONLY the provided Database Context. 
2. Do not invent, guess, or assume any information not explicitly listed in the Database Context. If an incubator's website or email is not in the context, do not make one up.
3. If the context states "No records matching...", or doesn't contain matching details to answer the user's specific question, you MUST explicitly state: "Based on the system database, I could not find matching records." Do not list or mention fake or external incubators.
4. For general conversational requests (e.g. hello) or conceptual definitions (e.g. explaining what an incubator does), you can explain the concept generally, but make sure not to mention any custom incubators that are not in the provided Database Context.

Database Context:
{context_str}
"""

            for model in models_to_try:
                try:
                    start = time.time()
                    response = requests.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {openrouter_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": query}
                            ],
                            "temperature": 0.1
                        },
                        timeout=12
                    )

                    if response.status_code == 200:
                        result = response.json()
                        reply = result["choices"][0]["message"]["content"]
                        response_time = round(time.time() - start, 2)

                        return {
                            "status": "success",
                            "mode": "openrouter",
                            "message": reply,
                            "model_used": model,
                            "response_time": response_time
                        }
                except Exception as e:
                    print(f"❌ {model} failed:", e)
                    continue

    # Fallback 2: Gemini API
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')

            prompt = f"""
            You are the AI Assistant for the Indian Startup Ecosystem Intelligence Portal.
            Answer the user's question clearly, professionally, and concisely using markdown formatting.

            User Question: "{query}"

            Strict Instruction on Avoiding Hallucinations:
            1. You must answer queries using ONLY the provided Database Context. 
            2. Do not invent, guess, or assume any information not explicitly listed in the Database Context. If an incubator's website or email is not in the context, do not make one up.
            3. If the context states "No records matching...", or doesn't contain matching details to answer the user's specific question, you MUST explicitly state: "Based on the system database, I could not find matching records." Do not list or mention fake or external incubators.
            4. For general conversational requests (e.g. hello) or conceptual definitions (e.g. explaining what an incubator does), you can explain the concept generally, but make sure not to mention any custom incubators that are not in the provided Database Context.

            Database Context:
            {context_str}

            Guidelines:
            - Format answers with lists, bold text, and tables where applicable to make them highly readable.
            - Ensure any links or emails mentioned are formatted as clickable markdown links.
            - Keep response under 3 paragraphs if possible.
            """

            response = model.generate_content(prompt)
            return {
                "status": "success",
                "mode": "gemini_ai",
                "message": response.text.strip(),
                "model_used": "gemini-1.5-flash",
                "response_time": 1.0
            }
        except Exception as e:
            pass

    # Fallback 3: Local database keyword search summary
    markdown_result = f"### Ecosystem Assistant (Local Database Match Mode)\n\n"
    if no_matches_found:
        markdown_result += "Based on the system database, I could not find matching records.\n"
    else:
        markdown_result += f"The AI Assistant is running in local search mode. Based on your query keywords, here are the most relevant incubator records found in the platform database:\n\n"
        markdown_result += "| Incubator Name | Location | Focus Sectors | Website |\n"
        markdown_result += "| :--- | :--- | :--- | :--- |\n"

        for r in rows:
            focus = "General"
            if r["focus_areas"]:
                try:
                    focus = ", ".join(json.loads(r["focus_areas"])[:3])
                except:
                    focus = r["focus_areas"]
            loc = f"{r['city'] or ''}, {r['state'] or ''}".strip(", ")
            markdown_result += f"| **{r['name']}** | {loc or 'India'} | {focus} | {r['website'] or 'N/A'} |\n"

        markdown_result += "\n\n**Suggestions for next steps:**\n"
        markdown_result += "- Click on the **Incubators Directory** tab to search and filter these records in detail.\n"
        markdown_result += "- Double-check spelling of states or cities in your question for better query matching.\n"

    return {
        "status": "success",
        "mode": "local_fallback",
        "message": markdown_result
    }
