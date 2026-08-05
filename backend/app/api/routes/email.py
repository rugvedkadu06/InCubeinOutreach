from fastapi import APIRouter

from ...schemas.email import MouSendRequest, ContactSendRequest
from ...services import send_mou_email, send_contact_email

router = APIRouter()


@router.post("/api/mou/send")
def api_send_mou_email(req: MouSendRequest):
    return send_mou_email(req)


@router.post("/api/contact/send")
def api_send_contact_email(req: ContactSendRequest):
    return send_contact_email(req)
