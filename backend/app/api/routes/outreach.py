from fastapi import APIRouter

from ...schemas.outreach import (
    AddLeadRequest,
    UpdateLeadStatusRequest,
    UpdateLeadNotesRequest,
    UpdateStageRequest,
    OutreachEmailRequest,
    OutreachReplyRequest,
    MassSendRequest,
    FollowupEmailRequest,
    OutreachConfig,
)
from ...services import (
    get_outreach_leads,
    add_outreach_lead,
    reset_outreach,
    update_lead_status,
    update_lead_notes,
    update_collaboration_stage,
    get_lead_timeline,
    trigger_outreach_email,
    trigger_mass_send,
    send_followup_single,
    send_followups,
    process_outreach_reply,
    get_outreach_config,
    update_outreach_config,
    trigger_check_replies,
)

router = APIRouter()


@router.get("/api/outreach/leads")
def api_get_outreach_leads():
    return get_outreach_leads()


@router.post("/api/outreach/add-lead")
def api_add_outreach_lead(req: AddLeadRequest):
    return add_outreach_lead(req)


@router.post("/api/outreach/reset")
def api_reset_outreach():
    return reset_outreach()


@router.post("/api/outreach/leads/update-status")
def api_update_lead_status(req: UpdateLeadStatusRequest):
    return update_lead_status(req)


@router.post("/api/outreach/leads/update-notes")
def api_update_lead_notes(req: UpdateLeadNotesRequest):
    return update_lead_notes(req)


@router.post("/api/outreach/update-stage")
def api_update_collaboration_stage(req: UpdateStageRequest):
    return update_collaboration_stage(req)


@router.get("/api/outreach/lead-timeline/{lead_id}")
def api_get_lead_timeline(lead_id: str):
    return get_lead_timeline(lead_id)


@router.post("/api/outreach/send-email")
def api_trigger_outreach_email(req: OutreachEmailRequest):
    return trigger_outreach_email(req)


@router.post("/api/outreach/mass-send")
def api_trigger_mass_send(req: MassSendRequest):
    return trigger_mass_send(req)


@router.post("/api/outreach/send-followup-single")
def api_send_followup_single(req: FollowupEmailRequest):
    return send_followup_single(req)


@router.post("/api/outreach/send-followups")
def api_send_followups():
    return send_followups()


@router.post("/api/outreach/simulate-reply")
def api_process_outreach_reply(req: OutreachReplyRequest):
    return process_outreach_reply(req)


@router.get("/api/outreach/config")
def api_get_outreach_config():
    return get_outreach_config()


@router.post("/api/outreach/config")
def api_update_outreach_config(cfg: OutreachConfig):
    return update_outreach_config(cfg)


@router.post("/api/outreach/check-replies")
def api_trigger_check_replies():
    return trigger_check_replies()
