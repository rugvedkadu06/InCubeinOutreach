# Pipeline Status

## 1. Page Purpose
The pipeline status page is a relationship-management view for moving incubator leads through the partnership lifecycle. Its purpose is to make outreach progress visible and easy to update through a drag-and-drop workflow.

## 2. Current UI Structure
The page contains:
- a notification banner for a highlighted partnership interest
- a header with the pipeline title and supporting description
- filter and sort actions
- a horizontal Kanban board with columns for pipeline stages
- cards representing each lead in a stage
- a slide-over drawer for reviewing lead details and activity history

The current stages are:
- Draft
- MOU Sent
- Awaiting Reply
- Interested
- Meeting Scheduled
- Partnership Completed

## 3. User Workflow
A typical user workflow is:
1. Open the pipeline page from the sidebar.
2. Review the current lead distribution across stages.
3. Drag a lead card into a new stage to update its status.
4. Click a lead card to open its detail drawer.
5. Review notes, correspondence, and activity information.
6. Mark a lead as complete or log follow-up actions from the drawer.

## 4. Data Requirements
The pipeline should display backend-driven lead and relationship data, including:
- lead names or incubator names
- email/contact details
- current status
- lead score or prioritization indicator
- notes or latest correspondence
- activity history when available

The page should not depend on static content for its primary workflow.

## 5. Functional Requirements
The current page supports:
- drag-and-drop status updates across the pipeline
- click-to-open lead detail drawer
- status-based rendering of cards and stages
- review-interest action from the banner
- filter and sort actions for quick management
- completion action for partnership finalization
- toast feedback after updates

These interactions should remain part of the workflow in any later redesign.

## 6. Future Redesign Notes
Possible redesign improvements for later implementation:
- make the pipeline more scannable with better column grouping and visual hierarchy
- add inline filtering by sector, score, or recency
- improve the drawer so it supports richer activity timelines
- add automation cues for next-best actions on each lead
- support keyboard and accessibility-friendly interactions for drag-and-drop workflows
