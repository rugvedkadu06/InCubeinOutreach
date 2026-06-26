# A centralized ecosystem intelligence platform for mapping and analyzing India's startup ecosystem, including incubators, accelerators, startups, mentors, investors, government schemes, and their interconnected relationships.

The platform provides an automated data intelligence pipeline for:

* Data Crawling & Collection
* Data Cleaning & Standardization
* Entity Resolution & Deduplication
* AI-Powered Enrichment
* Relationship Mapping
* Multi-format Data Export
* Interactive Analytics & Visualization

---

## 🚀 Key Features

### Ecosystem Intelligence Database

* Incubators
* Accelerators
* Startups
* Mentors
* Investors
* Government Programs
* Universities & Innovation Centers
* Relationship Networks

### Automated Data Pipeline

* Raw Data Ingestion
* Cleaning & Normalization
* Duplicate Detection
* AI-Based Enrichment
* Graph Construction
* Export Generation

### Interactive Dashboard

* Real-time Analytics
* Advanced Search & Filtering
* Entity Detail Views
* Knowledge Graph Visualization
* Export Management

---

# 🏗️ System Architecture

## Backend (FastAPI + Python)

Responsible for:

* Data ingestion and storage
* Cleaning and normalization
* Entity resolution
* AI enrichment
* Knowledge graph generation
* Export services
* REST API endpoints

### Core Modules

```text
backend/
│
├── app/
│   ├── database.py
│   ├── scraper.py
│   ├── cleaner.py
│   ├── resolution.py
│   ├── enricher.py
│   ├── graph.py
│   └── main.py
│
├── run.py
└── requirements.txt
```

---

## Frontend (React + Vite)

Provides a modern intelligence dashboard featuring:

* Glassmorphism UI
* Cyberpunk Dark Theme
* Analytics Dashboard
* Directory Explorer
* Knowledge Graph Visualizer
* Pipeline Control Center
* Export Manager

### Frontend Structure

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── AnalyticsDashboard.jsx
│   │   ├── DirectoryView.jsx
│   │   ├── GraphVisualizer.jsx
│   │   ├── PipelineControl.jsx
│   │   └── ExporterPanel.jsx
│   │
│   ├── App.jsx
│   └── index.css
│
└── package.json
```

---

# 📁 Project Structure

```text
/
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── scraper.py
│   │   ├── cleaner.py
│   │   ├── resolution.py
│   │   ├── enricher.py
│   │   ├── graph.py
│   │   └── main.py
│   │
│   ├── run.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Start Backend

```bash
cd backend

pip install -r requirements.txt

python run.py
```

Backend runs on:

```text
http://localhost:8000
```

---

## 2. Start Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# 🔄 Data Processing Pipeline

The platform executes the following pipeline stages:

## Phase 1 — Data Scraping

Collects raw ecosystem data from multiple sources containing:

* Duplicate entries
* Inconsistent naming
* Missing values
* Formatting issues

---

## Phase 2 — Data Cleaning

Performs:

* State normalization

  * MH → Maharashtra
* City normalization

  * Bombay → Mumbai
* Email validation
* URL standardization
* Text normalization

---

## Phase 3 — Entity Resolution

Detects and merges duplicate records using:

* Jaccard Similarity
* Acronym Matching
* Fuzzy Name Matching
* Relationship Reconciliation

### Example

```text
SINE IIT Bombay
=
Society for Innovation and Entrepreneurship IIT Bombay
```

---

## Phase 4 — AI Enrichment

Automatically enriches missing information through:

### Local Intelligence Engine

* Sector classification
* Focus area tagging
* Relationship inference
* Metadata generation

### Google Gemini Integration

If `GEMINI_API_KEY` is available:

* Semantic summaries
* Sector tagging
* Ecosystem categorization
* Opportunity identification

---

# 📊 Analytics & Visualization

The dashboard includes:

### Ecosystem Metrics

* Total Startups
* Total Incubators
* Total Investors
* Total Mentors
* Active Relationships

### Directory Explorer

Advanced filtering by:

* State
* City
* Sector
* Organization Type
* Focus Area

### Knowledge Graph

Interactive force-directed visualization with:

* Zooming
* Panning
* Relationship exploration
* Node highlighting
* Cluster discovery

---

# 📤 Export Formats

## CSV Archive

Exports:

```text
incubators.csv
startups.csv
mentors.csv
investors.csv
relationships.csv
```

---

## Ecosystem JSON

Single hierarchical JSON document containing:

* Entities
* Metadata
* Relationships

---

## MongoDB Export

Generates:

```javascript
db.collection.insertMany(...)
```

scripts for direct import into MongoDB.

---

## Neo4j Export

Generates Cypher scripts for:

* Constraints
* Nodes
* Relationships
* Graph Construction

Example:

```cypher
MERGE (i:Incubator {name:"SINE"})
MERGE (s:Startup {name:"Example Startup"})
MERGE (i)-[:INCUBATES]->(s)
```

---

# 🧠 Technology Stack

## Backend

* Python
* FastAPI
* SQLite
* Pandas
* NetworkX

## Frontend

* React
* Vite
* Vanilla CSS
* Canvas API

## AI & Enrichment

* Google Gemini API (Optional)

## Graph Databases

* Neo4j

## Document Databases

* MongoDB

---

# 🎯 Use Cases

* Startup Ecosystem Mapping
* Incubator Discovery
* Investor Intelligence
* Mentor Network Analysis
* Government Scheme Tracking
* Research & Policy Analytics
* Innovation Ecosystem Visualization
* Partnership Discovery

---

# 📜 License

This project is intended for educational, research, and ecosystem intelligence purposes.
