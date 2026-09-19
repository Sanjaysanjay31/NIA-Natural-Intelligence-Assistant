from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from app.modules.digital_state.models import NormalizedEvent
from app.modules.digital_state.provider import digital_state_provider

router = APIRouter(prefix="/digital-state", tags=["Digital State Ground Truth"])


class PermissionChoiceRequest(BaseModel):
    choice: str  # "ALLOW" or "NOT_NOW"


@router.get("/permission-explanation")
async def get_permission_explanation() -> Dict[str, str]:
    """Explain why NIA needs calendar access before requesting permission."""
    return digital_state_provider.get_permission_explanation()


@router.post("/permission")
async def set_permission_choice(req: PermissionChoiceRequest) -> Dict[str, Any]:
    """
    Handle user's permission choice.
    Only if user chooses ALLOW is calendar access claimed/permitted.
    """
    granted = digital_state_provider.handle_permission_choice(req.choice)
    return {
        "choice": req.choice,
        "permissionGranted": granted,
        "status": "GRANTED" if granted else "DENIED"
    }


@router.get("/events", response_model=List[NormalizedEvent])
async def list_events() -> List[NormalizedEvent]:
    """Retrieve upcoming synchronized calendar events feeding reality checking."""
    try:
        return await digital_state_provider.get_upcoming_events()
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/events/{event_id}", response_model=NormalizedEvent)
async def get_event(event_id: str) -> NormalizedEvent:
    """Retrieve single digital event by ID."""
    try:
        ev = await digital_state_provider.get_event_by_id(event_id)
        if not ev:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found in digital state."
            )
        return ev
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/sync", response_model=List[NormalizedEvent])
async def sync_events() -> List[NormalizedEvent]:
    """Refresh and synchronize digital events."""
    try:
        return await digital_state_provider.refresh_events()
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
