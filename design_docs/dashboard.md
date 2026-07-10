# Dashboard

## 1. Page Purpose
The dashboard is the executive overview page. It helps leadership quickly understand the current state of the incubator network, outreach activity, and recent platform operations.

## 2. Current UI Structure
The page is composed of the following sections:
- a page header with the title and summary text
- a row of top-level action buttons for time-based reporting and report export
- KPI cards showing high-level numbers such as total incubators, MOUs sent, active collaborations, successful partnerships, and upcoming meetings
- a large network map card showing incubator distribution visually
- a chart-style section for sector distribution
- a performance funnel card for outreach conversion stages
- a state distribution panel for regional concentration
- an upcoming meetings widget
- a recent ingestion activity feed

## 3. User Workflow
A typical user journey is:
1. Open the dashboard from the sidebar.
2. Review the current KPI summary at a glance.
3. Scan the incubator network map and distribution panels.
4. Review outreach funnel performance and state coverage.
5. Check upcoming meetings and recent system activity.
6. Export a report or refresh data if more detail is needed.

## 4. Data Requirements
The dashboard should display information that comes from backend data sources, including:
- analytics totals for incubators, states, cities, and sectors
- state and sector distributions
- meeting schedules
- pipeline logs or ingestion activity

The UI currently includes fallback values when backend data is unavailable, but the preferred source of truth should remain the backend API.

## 5. Functional Requirements
The current dashboard supports:
- display of KPI cards with live or fallback values
- a report export action that opens a backend export endpoint
- refresh behavior to reconnect to the backend
- view-all and detail-style actions for distribution summaries
- display of recent meetings and recent activity feed entries

The page should continue to present operational metrics clearly and should not replace data-driven content with static placeholders.

## 6. Future Redesign Notes
Possible redesign improvements for later implementation:
- replace static visual blocks with richer interactive charts
- add date-range filtering for analytics views
- improve the map card so it becomes more informative and less decorative
- make the activity feed more structured and filterable
- add clearer drill-down paths for each KPI
