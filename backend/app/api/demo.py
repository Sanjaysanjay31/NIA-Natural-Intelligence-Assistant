from fastapi import APIRouter, Path
from typing import Dict, Any
from app.modules.demo.controller import demo_controller

router = APIRouter(prefix="/demo", tags=["Deterministic Demo Mode"])


@router.get("/state")
async def get_demo_state() -> Dict[str, Any]:
    """Retrieve the current deterministic scenario state."""
    return demo_controller.get_current_state()


@router.post("/reset")
async def reset_demo() -> Dict[str, Any]:
    """Reset the demo scenario back to step 1."""
    return demo_controller.reset()


@router.post("/step-forward")
async def step_forward() -> Dict[str, Any]:
    """Advance the demo scenario by one step."""
    return demo_controller.step_forward()


@router.post("/step-backward")
async def step_backward() -> Dict[str, Any]:
    """Rewind the demo scenario by one step."""
    return demo_controller.step_backward()


@router.post("/jump/{step}")
async def jump_to_step(
    step: int = Path(..., ge=1, le=17, description="Target step between 1 and 17")
) -> Dict[str, Any]:
    """Jump directly to any of the 17 deterministic steps."""
    return demo_controller.jump_to_step(step)


@router.post("/run-e2e")
async def run_e2e_flow() -> Dict[str, Any]:
    """Execute the full end-to-end flow using real underlying module services."""
    return await demo_controller.run_full_e2e_flow()
