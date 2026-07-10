# Global Design System

## 1. Project Overview
InCubein Outreach is a web-based platform for managing the Indian startup and incubator ecosystem. Its current purpose is to combine ecosystem intelligence, incubator directory management, outreach automation, and partnership tracking in a single operational workspace.

## 2. Purpose of the Platform
The platform is designed to help a team:
- understand the incubator landscape across India
- search and review incubator records
- draft and send MOU documents
- monitor outreach activity and lead progression
- track partnerships through a visual pipeline
- review analytics and recent operations from one dashboard

## 3. Target Users
The current UI is oriented toward internal operations users such as:
- executive leadership
- partnership or outreach managers
- ecosystem program teams
- operations staff coordinating incubator engagement

## 4. Current Design Style
The interface currently uses a polished, dashboard-first visual system with:
- a light neutral background
- strong blue primary accents
- rounded cards and controls
- soft shadows and subtle borders
- material-style icons
- a modern sans-serif type system

This style is best understood as a “productivity dashboard” rather than a marketing website. It should remain professional, calm, and structured.

## 5. Layout Structure
The app follows a consistent shell:
- a login screen for entry
- a left sidebar for primary navigation on desktop
- a top app bar with search, sync, notification, and profile area
- a main content canvas that hosts the current page content
- a floating AI assistant widget that remains available globally

## 6. Sidebar / Navigation Structure
The current navigation includes:
- Dashboard
- Incubator Directory
- MOU & Outreach
- Pipeline / Status

A prominent secondary action is available to create a new MOU directly from the sidebar. The navigation is intentionally short and task-oriented.

## 7. Common Components
The current UI relies on a small set of reusable patterns:
- page headers with title and supporting text
- stat cards for KPI summaries
- content cards for grouped information
- tables for structured records
- form panels for editing or submission
- slide-over drawers for profile or detail views
- toast notifications for action feedback
- loading and empty states for data-driven views

## 8. Card Patterns
Cards are the primary content unit. They generally follow this pattern:
- light background
- rounded corners
- thin border
- subtle shadow
- internal spacing for title, summary, and actions

Card usage includes:
- dashboard analytics blocks
- data summary panels
- lead or activity listings
- settings or control panels
- detail containers inside tabbed sections

## 9. Table Patterns
Tables are used in the directory and outreach lead views. They generally include:
- a simple header row with uppercase labels
- left-aligned content columns
- action buttons in the last column
- hover states for row interaction
- pagination footers where appropriate

The table style should remain compact, legible, and suitable for operational data review.

## 10. Button Patterns
Buttons currently follow three primary tones:
- Primary: high-emphasis actions such as Create New MOU, Send MOU, and Save
- Secondary: supportive or neutral actions such as filters, reset, and cancel
- Tertiary or text-like: inline actions and utility controls

Buttons are generally rounded, clearly labeled, and paired with icons where possible.

## 11. Form Patterns
Forms are mostly used for operational tasks rather than marketing content. Standard behavior includes:
- label above each field
- bordered input surfaces with light background
- clear focus states
- inline validation-style feedback through toast messages rather than form-level error banners

Common input types include text, select, date, checkbox, textarea, and email fields.

## 12. Modal / Drawer Patterns
The interface does not rely on a traditional modal system for content detail. Instead, it uses slide-over drawers for deeper inspection, such as:
- incubator profile details
- lead detail review
- pipeline item details

This pattern should remain consistent for detail-oriented workflows.

## 13. Color Usage
The current palette is built around a calm blue-first system:
- Primary blue: action emphasis and major buttons
- Neutral surface tones: background and card surfaces
- Slate and dark blue: secondary emphasis and text hierarchy
- Red: destructive or alert states
- Green: success or positive progress states

The palette should stay restrained and businesslike rather than playful or colorful.

## 14. Typography Usage
Typography uses Inter as the primary typeface. The interface currently applies a clear hierarchy:
- large display-style headings for page titles
- medium headings for section titles
- smaller labels for metadata or filters
- body text for descriptions and table content

The system favors clarity and compactness over decorative typography.

## 15. Spacing and Layout Rules
The layout uses a structured spacing approach:
- larger gaps between major sections
- consistent padding inside cards and panels
- compact spacing inside forms and tables
- a responsive content max width for major pages

The current framework suggests a desktop-first layout that becomes more compact on smaller screens.

## 16. Responsive Considerations
The application already adapts to smaller screens by:
- collapsing the sidebar into a mobile overlay
- switching to a mobile-friendly top bar
- stacking sections vertically where needed
- preserving access to primary actions without requiring desktop width

Responsive behavior should continue to prioritize task completion and readable content over visual density.

## 17. Shared UI Behavior
The following behaviors are currently shared across the experience and should remain consistent:
- loading states while data is fetched from the backend
- empty states when no search results or records are present
- toast-based confirmation for completed actions
- fast transitions between views through the sidebar navigation
- search-driven routing to the directory experience
- global refresh actions for data sync

## 18. Design Principles to Preserve
For future redesign or implementation work, the following should stay consistent:
- professional, operational tone
- clear hierarchy and low visual noise
- strong focus on task completion
- a calm, trustworthy product feel
- a dashboard-like structure for analytic and management work
- lightweight but polished interaction patterns
