from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, status, HTTPException, Query

from app.core.errors import EntityNotFoundException
from app.modules.commitments.schemas import (
    Commitment,
    CommitmentStatus,
    CommitmentUpdate,
    CommitmentExtractionRequest,
    CommitmentExtractionResponse,
    CommitmentLinkRequest,
)
from app.modules.commitments.service import commitment_service
from app.modules.commitments.repository import (
    CommitmentNotFoundException,
    CommitmentAlreadyExistsException,
    InvalidStatusTransitionException,
)

router = APIRouter(prefix="/commitments", tags=["Commitment Intelligence"])


class StatusUpdatePayload(BaseModel):
    """Payload for updating commitment status."""
    status: CommitmentStatus = Field(..., description="Target lifecycle status")


class DeleteResponse(BaseModel):
    """Payload returned on successful deletion."""
    success: bool = True
    deleted_id: str
    message: str = "Commitment deleted successfully"


@router.post(
    "/extract",
    response_model=CommitmentExtractionResponse,
    summary="Extract commitments from voice memo or transcript",
    description="Deterministic rule-based extraction of personal and interpersonal commitments.",
)
async def extract_commitments(request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
    return commitment_service.extract_commitments(request)


@router.post(
    "",
    response_model=Commitment,
    status_code=status.HTTP_201_CREATED,
    summary="Create a commitment",
    description="Persist a newly validated commitment in the system.",
)
async def create_commitment(commitment: Commitment) -> Commitment:
    try:
        return await commitment_service.create_commitment(commitment)
    except CommitmentAlreadyExistsException as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc)
        )


@router.get(
    "",
    response_model=List[Commitment],
    summary="List commitments",
    description="Retrieve commitments with optional filtering by owner, status, event, or location.",
)
async def list_commitments(
    owner: Optional[str] = Query(default=None, description="Filter by owner"),
    status: Optional[CommitmentStatus] = Query(default=None, description="Filter by status"),
    related_event_id: Optional[str] = Query(default=None, alias="relatedEventId", description="Filter by event ID"),
    related_location: Optional[str] = Query(default=None, alias="relatedLocation", description="Filter by location"),
) -> List[Commitment]:
    return await commitment_service.list_commitments(
        owner=owner,
        status=status,
        related_event_id=related_event_id,
        related_location=related_location,
    )


@router.get(
    "/{id}",
    response_model=Commitment,
    summary="Get commitment by ID",
    description="Retrieve full details and evidence for a specific commitment.",
)
async def get_commitment(id: str) -> Commitment:
    cmt = await commitment_service.get_commitment(id)
    if not cmt:
        raise EntityNotFoundException("Commitment", id)
    return cmt


@router.patch(
    "/{id}",
    response_model=Commitment,
    summary="Update commitment",
    description="Apply partial updates to a commitment's mutable fields.",
)
async def update_commitment(id: str, payload: CommitmentUpdate) -> Commitment:
    try:
        return await commitment_service.update_commitment(id, payload)
    except CommitmentNotFoundException:
        raise EntityNotFoundException("Commitment", id)
    except InvalidStatusTransitionException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


@router.patch(
    "/{id}/status",
    response_model=Commitment,
    summary="Update commitment status",
    description="Transition commitment status with lifecycle validation.",
)
async def update_commitment_status(id: str, payload: StatusUpdatePayload) -> Commitment:
    try:
        return await commitment_service.update_status(id, payload.status)
    except CommitmentNotFoundException:
        raise EntityNotFoundException("Commitment", id)
    except InvalidStatusTransitionException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


@router.patch(
    "/{id}/link",
    response_model=Commitment,
    summary="Link commitment to reality entities",
    description="Associate commitment with an event ID and/or physical location.",
)
async def link_commitment(id: str, payload: CommitmentLinkRequest) -> Commitment:
    try:
        return await commitment_service.link_commitment(
            commitment_id=id,
            related_event_id=payload.related_event_id,
            related_location=payload.related_location,
        )
    except CommitmentNotFoundException:
        raise EntityNotFoundException("Commitment", id)


@router.delete(
    "/{id}",
    response_model=DeleteResponse,
    summary="Delete commitment",
    description="Permanently remove a commitment by ID.",
)
async def delete_commitment(id: str) -> DeleteResponse:
    try:
        await commitment_service.delete_commitment(id)
        return DeleteResponse(deleted_id=id)
    except CommitmentNotFoundException:
        raise EntityNotFoundException("Commitment", id)
