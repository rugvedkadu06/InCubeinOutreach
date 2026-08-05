from fastapi import APIRouter

from ...schemas.incubators import ContactUpdateRequest, FinderRequest
from ...services import update_incubator_contact, find_matching_incubators

router = APIRouter()


@router.post("/api/incubators/update-contact")
def api_update_incubator_contact(req: ContactUpdateRequest):
    return update_incubator_contact(req)


@router.post("/api/incubators/find-matches")
def api_find_matching_incubators(req: FinderRequest):
    return find_matching_incubators(req)
