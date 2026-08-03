# INCUBEIN Cohort Evaluator - Technical Documentation

The Cohort Evaluator is a secure, automated, dynamic decision-support system designed to ingest, process, evaluate, score, and rank applications for both the **INCUBEIN Startup Cohort Program** and **Incubator Cohort Evaluation**. It balances data security (PII field-level encryption) with dynamic computational utility (parsing and scoring any arbitrary Excel columns/features).

---

## 1. System Architecture

```text
Any Excel Upload (.xlsx / .xls)
      ↓
FastAPI Dynamic Parsing
(Entity Mode: "startup" | "incubator")
      ↓
┌───────────────────────────┴───────────────────────────┐
▼                                                       ▼
Encrypt Sensitive Fields (Fernet AES)          Extract All Raw Columns & Data
(Name, Email, Mobile, Address, DOB)           (all_columns, raw_data dictionary)
      │                                                 │
      ▼                                                 ▼
MongoDB Persistence                              Scoring & Dynamic Evaluation
(incubein_applications)                         1. Mapped Rule Engine Score (max 40)
      │                                         2. Dynamic Feature Scoring (Arbitrary Columns)
      │                                         3. Blended Final Score & Heuristics
      │                                         4. Similarity Matrix (TF-IDF Cosine Sim)
      │                                                 │
      ▼                                                 ▼
      ├─────────────────────────────────────────────────┘
      ▼
On-the-Fly Decryption (Admin View)
      ↓
React Cohort Dashboard
(Dynamic Feature Inspector & Comparison Modal)
```

---

## 2. PII Field-Level Encryption

To comply with data privacy best practices, sensitive PII fields are encrypted prior to being stored in MongoDB:
- **Symmetric Encryption**: Uses **Fernet (AES-128/256)** via Python's `cryptography.fernet.Fernet`.
- **Environment Key**: Stored in the `.env` configuration file as `ENCRYPTION_KEY`.
- **On-the-Fly Decryption**: Decrypted on-the-fly when requested by admins, ensuring database dumps do not expose contact info.
- **Encrypted Fields**:
  - `Name (First Middle Last)`
  - `Email Address`
  - `Mobile Number`
  - `Alternet Mobile Number`
  - `Date of Birth`
  - `Address`

---

## 3. Evaluation & Dynamic Scoring Pipeline

The system processes **ANY random Excel file** with arbitrary columns and headers. It automatically identifies the primary Entity/Applicant Name (using header regex patterns or falling back to the first non-empty text column) and evaluates both standard mapped fields and dynamic uploaded features.

### 3.1 Mapped Rule Engine
Evaluates standard recognized fields (Revenue, Stage, DPIIT, Team Size, Website, Pitch Deck) out of 40 raw points:
1. **Revenue Score** (max 10 pts):
   - 0 pts: ₹0 / None
   - 5 pts: $\le$ ₹5 Lakhs
   - 8 pts: $\le$ ₹20 Lakhs
   - 10 pts: $>$ ₹20 Lakhs
2. **Stage Score** (max 10 pts):
   - 10 pts: Early Traction, Growth, Scaling, Revenue
   - 8 pts: MVP
   - 6 pts: Prototype
   - 4 pts: Idea / Concept
3. **DPIIT Registration** (max 5 pts):
   - 5 pts: Registered (with DPIIT number)
   - 0 pts: Unregistered
4. **Team Size Score** (max 5 pts):
   - 5 pts: $\ge$ 5 members
   - 4 pts: 2 to 4 members
   - 2 pts: Single founder
5. **Website & Pitch Deck Scores** (5 pts each if valid URLs/attachments present).

### 3.2 Dynamic Feature Scoring Engine (Arbitrary Columns)
Evaluates **ALL custom/random columns** present in the uploaded sheet:
- **Numeric Columns** (Grants, Ratings, Scores, Capacity, Funding, Marks, Years): Normalizes numerical values to a $0 - 100$ scale.
- **Affirmative / Boolean Signals** (`Yes`, `True`, `Active`, `Certified`, `Registered`, `Granted`, `Approved`, `High`, `Top`): Awards high positive score signals ($90\%$).
- **Negative / Missing Signals** (`No`, `False`, `Pending`, `None`, `N/A`): Flags missing or unconfirmed indicators ($20\%$).
- **Text Detail & Quality**: Evaluates completeness, word count depth, and detail length for summaries, descriptions, and comments.

### 3.3 Blended Final Score & Priority Ranking
When dynamic headers are present ($>6$ columns):
$$\text{Final Score} = \text{Round}\big(0.4 \times \text{Rule Score} + 0.6 \times \text{Dynamic Feature Score}, 1\big)$$

- **Priority Categorization**:
  - **High Priority**: $\text{Final Score} \ge 70$
  - **Medium Priority**: $40 \le \text{Final Score} < 70$
  - **Low Priority**: $\text{Final Score} < 40$
- **Cohort Ranking**: Candidates are ordered by `Final Score` descending to assign cohort ranks ($1 \dots N$).

---

## 4. Similarity Indexing (Duplicate Detection)

To detect duplicate submissions or idea overlaps:
1. **Local TF-IDF Vectorization**: Analyzes business summaries and description texts.
2. **Cosine Similarity**: Computes pairwise correlation matrices.
3. **Flagging Threshold**: Pairs with similarity $\ge 40\%$ are logged, and scores $\ge 80\%$ trigger a high-visibility warning badge on the dashboard.

---

## 5. UI Capabilities & Dynamic Feature Inspection

Access **Startup Cohort Evaluator** or **Incubator Cohort Evaluator** on the portal:
- **Universal Excel Upload**: Drag-and-drop any Excel file (`.xlsx`, `.xls`) with standard or custom column headers.
- **Dynamic Feature Inspector**: Click any entry to inspect all uploaded Excel columns, raw values, and individual column score badges in the right-hand panel.
- **Side-by-Side Comparison**: Select 2 or 3 entries to compare standard metrics and custom uploaded features side-by-side.
- **Shortlist Filters**: Filter by Sector, Stage, Search Query, Min Score, and Shortlist Mode (Top 5, Top 10, Top 20, or All).
- **Direct Database & Campaign Import**: Export selected entries directly into the Ecosystem Database or Outreach Email Campaigns.

