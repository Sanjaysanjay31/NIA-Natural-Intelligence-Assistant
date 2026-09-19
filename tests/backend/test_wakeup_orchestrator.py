import asyncio
import pytest
from app.schemas import WakeUpEvent, WakeUpSource, AgentState
from app.modules.orchestration.wake_up import WakeUpOrchestrator


def test_path_1_wake_word():
    """Path 1: 'Hey NIA' -> activate -> orb -> LISTENING -> voice pipeline."""
    orch = WakeUpOrchestrator()
    ev = WakeUpEvent(
        source=WakeUpSource.WAKE_WORD,
        session_id="sess-path-1",
        capabilities={"alwaysListening": "simulation", "platformMode": "expo_go"}
    )

    route = orch.route(ev)
    assert route.target_route == "VOICE_PIPELINE"
    assert route.initial_state == AgentState.LISTENING

    session = asyncio.run(orch.activate(ev))
    assert session.active_state == AgentState.LISTENING
    assert session.session_id == "sess-path-1"
    assert session.context["target_route"] == "VOICE_PIPELINE"


def test_path_2_orb_interaction():
    """Path 2: Orb tap/hold -> verification/action mode -> current context."""
    orch = WakeUpOrchestrator()
    ev = WakeUpEvent(
        source=WakeUpSource.ORB,
        session_id="sess-path-2",
        payload={"interactionType": "hold"}
    )

    route = orch.route(ev)
    assert route.target_route == "VERIFY_CONTEXT"
    assert route.initial_state == AgentState.VERIFYING

    session = asyncio.run(orch.activate(ev))
    assert session.active_state == AgentState.VERIFYING
    assert session.session_id == "sess-path-2"


def test_path_3_mind_pulse():
    """Path 3: 3-finger swipe up -> Mind Pulse -> capture/extract/verify."""
    orch = WakeUpOrchestrator()
    ev = WakeUpEvent(
        source=WakeUpSource.MIND_PULSE,
        session_id="sess-path-3",
        payload={"gesture": "three_finger_swipe_up"}
    )

    route = orch.route(ev)
    assert route.target_route == "MIND_PULSE"
    assert route.initial_state == AgentState.VERIFYING

    session = asyncio.run(orch.activate(ev))
    assert session.active_state == AgentState.VERIFYING
    assert session.context["target_route"] == "MIND_PULSE"


def test_path_4_app_icon():
    """Path 4: App icon -> full NIA screen."""
    orch = WakeUpOrchestrator()
    ev = WakeUpEvent(
        source=WakeUpSource.APP_ICON,
        session_id="sess-path-4"
    )

    route = orch.route(ev)
    assert route.target_route == "AGENT_HOME"
    assert route.initial_state == AgentState.IDLE

    session = asyncio.run(orch.activate(ev))
    assert session.active_state == AgentState.IDLE
    assert session.context["target_route"] == "AGENT_HOME"


def test_session_cancellation_returns_to_idle():
    """Cancellation transitions active session cleanly back to IDLE."""
    orch = WakeUpOrchestrator()
    ev = WakeUpEvent(
        source=WakeUpSource.WAKE_WORD,
        session_id="sess-cancel-test"
    )

    asyncio.run(orch.activate(ev))
    assert orch.get_current_session().active_state == AgentState.LISTENING

    cancelled_session = orch.cancel()
    assert cancelled_session.active_state == AgentState.IDLE
    assert cancelled_session.context.get("cancelled") is True
