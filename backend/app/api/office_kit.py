from fastapi import APIRouter
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.modules.office_kit.audit_generator import AuditReportGenerator

router = APIRouter(prefix="/office-kit", tags=["Office Kit Reality Audit Export"])


class AuditExportRequest(BaseModel):
    session_id: Optional[str] = "sess-demo-audit-1"


@router.post("/generate-audit")
async def generate_audit_export(req: AuditExportRequest) -> Dict[str, Any]:
    """Generate the 10-section Reality Audit Report for export/screen mirror."""
    report = AuditReportGenerator.generate_demo_report(req.session_id)
    markdown = AuditReportGenerator.to_markdown(report)
    return {
        "report": report,
        "markdown": markdown
    }
