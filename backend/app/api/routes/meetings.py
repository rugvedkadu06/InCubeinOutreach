from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Optional

from ...schemas.meetings import ScheduleMeetingRequest
from ...schemas.outreach import UpdateMeetingStatusRequest
from ...services import (
    build_oauth_authorization_url,
    exchange_oauth_code,
    get_oauth_status,
    schedule_meeting,
    get_outreach_meetings,
    update_meeting_status,
    get_external_calendar_events,
)

router = APIRouter()


@router.get("/api/outreach/authorize")
def google_authorize():
    url = build_oauth_authorization_url(
        "Google OAuth credentials are not configured in backend/.env file. Please populate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    )
    return {"authorization_url": url}


@router.get("/api/outreach/google/auth")
def google_auth_alias():
    """Alias route — same as /api/outreach/authorize. Redirects browser directly to Google OAuth."""
    url = build_oauth_authorization_url(
        "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
    )
    return RedirectResponse(url)


@router.get("/api/outreach/oauth2callback")
def google_oauth2callback(code: str, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        return HTMLResponse(content=f"<h3>Authorization Error</h3><p>{error}</p>", status_code=400)
    try:
        exchange_oauth_code(code, state)
    except Exception as e:
        return HTMLResponse(content=f"<h3>Token Exchange Failed</h3><p>{str(e)}</p>", status_code=500)

    html_content = """
    <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 5rem; background: #f8f9ff;">
            <h2 style="color: #10b981;">✓ Google Calendar Authorization Successful!</h2>
            <p>The outreach automation system has been authorized to schedule Google Meet meetings.</p>
            <p style="color: #6b7280; font-size: 0.9rem;">You can close this tab and return to the Incubein dashboard.</p>
            <script>
                setTimeout(() => { window.close(); }, 5000);
            </script>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/api/outreach/oauth-status")
def api_get_oauth_status():
    return get_oauth_status()


@router.post("/api/outreach/schedule-meeting")
def api_schedule_meeting(req: ScheduleMeetingRequest):
    return schedule_meeting(req)


@router.get("/api/outreach/meetings")
def api_get_outreach_meetings():
    return get_outreach_meetings()


@router.post("/api/outreach/meetings/update-status")
def api_update_meeting_status(req: UpdateMeetingStatusRequest):
    return update_meeting_status(req)


@router.get("/api/outreach/calendar-events")
def api_get_external_calendar_events():
    return get_external_calendar_events()
