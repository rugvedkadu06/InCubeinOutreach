# MOU & Outreach

## 1. Page Purpose
The MOU & Outreach page is the operational workspace for creating partnership documents and managing outreach campaigns. It combines document generation, lead management, campaign controls, and system console visibility into one experience.

## 2. Current UI Structure
The page uses tabs to organize four major work areas:
- MOU Generator
- Active Leads
- Campaign Controls
- Console & Events

### MOU Generator
This view includes:
- left-side form panels for selecting an incubator, setting MOU details, and configuring outreach settings
- a right-side document editor canvas showing an MOU draft
- signature pad controls
- actions to preview, download, or send the MOU by email

### Active Leads
This view includes:
- a leads table with incubator name, email, status, score, and actions
- search and status filters
- detail panel for selected lead notes and correspondence
- meeting scheduling controls for replied leads

### Campaign Controls
This view includes:
- inbox sync interval control
- inbox scan action
- Google Calendar connection status
- reset database action for pipeline data

### Console & Events
This view includes:
- a terminal-style log stream for system and outreach events
- a synced events panel for calendar events

## 3. User Workflow
A typical user workflow is:
1. Open the MOU & Outreach page from the sidebar.
2. Select an incubator in the generator tab.
3. Adjust MOU details such as date, duration, focus areas, and signature.
4. Review the generated document preview.
5. Update recipient email and subject details.
6. Send the MOU through the email workflow.
7. Track the lead in the Active Leads tab and update its status.
8. Use campaign controls to manage connection settings and sync tasks.
9. Monitor system actions and calendar events in the console view.

## 4. Data Requirements
This page depends on multiple backend data sources, including:
- incubator records for selection and prefill
- outreach leads and their statuses
- meetings and calendar events
- inbox reply scan information
- OAuth or calendar integration status
- MOU content generation and email dispatch responses

The page should not rely on hardcoded lead data as the primary source of truth.

## 5. Functional Requirements
The current experience includes:
- selecting an incubator and auto-prefilling contact details
- editing MOU content and document values inline
- drawing or adopting a digital signature
- sending MOU email documents through a backend API
- updating lead notes and statuses
- searching and filtering leads
- scheduling meetings for responsive leads
- checking inbox replies
- changing sync interval settings
- resetting campaign data with confirmation
- viewing live console logs and calendar event data

## 6. Future Redesign Notes
Possible redesign improvements for later implementation:
- simplify the multi-tab workflow into a more linear guided experience
- add clearer progress steps for MOU creation and sending
- improve document editor usability and preview state
- make lead statuses more visual and easier to interpret
- provide better onboarding for calendar and inbox integration setup
