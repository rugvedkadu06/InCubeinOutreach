# Incubator Directory

## 1. Page Purpose
The incubator directory is the main inventory and search page for ecosystem institutions. It helps users browse incubators, filter them by location or sector, and initiate outreach actions.

## 2. Current UI Structure
The page contains:
- a page header with a short explanatory description
- a filter bar with keyword, state, city, and sector controls
- a reset button to clear active filters
- a large data table listing incubators
- pagination controls beneath the table
- a slide-over drawer for viewing a selected incubator profile in more detail

The table includes columns for:
- incubator name
- location
- sector or type
- contact email
- source/status
- actions

## 3. User Workflow
A typical user workflow is:
1. Open the directory page from the sidebar.
2. Use keyword or filter controls to narrow the incubator list.
3. Review the table of matching incubators.
4. Click View Details to inspect an incubator profile.
5. Click the handshake action to start drafting an MOU for that incubator.
6. Move through the result set using pagination if needed.

## 4. Data Requirements
This page should display data that comes from the backend, including:
- incubator names
- city and state
- sector or organizational type
- email addresses
- source/status metadata
- descriptions and institutional detail when available

The UI should avoid relying on hardcoded rows and should reflect backend search and filter results.

## 5. Functional Requirements
The current directory experience includes:
- keyword-based search
- filter by state, city, and sector
- reset filters action
- table of incubators with row actions
- profile drawer with deeper information
- MOU draft action from a selected incubator row
- clickable email links
- pagination for large result sets

These behaviors should remain intact in any redesign.

## 6. Future Redesign Notes
Possible later improvements include:
- card-based directory layout alternatives
- improved empty states and no-result guidance
- richer profile drawer content with tabs or sections
- saved search presets or filter chips
- better mobile usability for the table and drawer
