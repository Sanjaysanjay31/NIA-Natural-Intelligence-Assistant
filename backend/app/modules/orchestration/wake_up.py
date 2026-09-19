from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.schemas import WakeUpEvent, WakeUpSource, Session, AgentState


class WakeUpRoute:
    def __init__(self, source: WakeUpSource, target_route: str, initial_state: AgentState, description: str):
        self.source = source
        self.target_route = target_route
        self.initial_state = initial_state
        self.description = description


class WakeUpOrchestrator:
    """
    Unified Orchestration Engine for all 4 activation paths.
    Guarantees:
    - All paths produce the same WakeUpEvent and enter the same orchestrator.
    - No duplicated business logic per trigger.
    - Deterministic state mapping and cancellation.
    """

    def __init__(self):
        self._current_session: Optional[Session] = None

    def route(self, event: WakeUpEvent) -> WakeUpRoute:
        if event.source == WakeUpSource.WAKE_WORD:
            return WakeUpRoute(
                source=WakeUpSource.WAKE_WORD,
                target_route="VOICE_PIPELINE",
                initial_state=AgentState.LISTENING,
                description="Path 1: 'Hey NIA' -> activate -> orb -> LISTENING -> voice pipeline"
            )
        elif event.source == WakeUpSource.ORB:
            return WakeUpRoute(
                source=WakeUpSource.ORB,
                target_route="VERIFY_CONTEXT",
                initial_state=AgentState.VERIFYING,
                description="Path 2: Orb tap/hold -> verification/action mode -> current context"
            )
        elif event.source == WakeUpSource.MIND_PULSE:
            return WakeUpRoute(
                source=WakeUpSource.MIND_PULSE,
                target_route="MIND_PULSE",
                initial_state=AgentState.VERIFYING,
                description="Path 3: 3-finger swipe up -> Mind Pulse -> capture/extract/verify"
            )
        elif event.source == WakeUpSource.APP_ICON:
            return WakeUpRoute(
                source=WakeUpSource.APP_ICON,
                target_route="AGENT_HOME",
                initial_state=AgentState.IDLE,
                description="Path 4: App icon -> full NIA screen"
            )
        else:
            return WakeUpRoute(
                source=WakeUpSource.APP_ICON,
                target_route="AGENT_HOME",
                initial_state=AgentState.IDLE,
                description="Default: App icon -> full NIA screen"
            )

    async def activate(self, event: WakeUpEvent) -> Session:
        route_target = self.route(event)
        now = datetime.now(timezone.utc)

        # One session has one ID; reuse or initialize
        session_id = event.session_id or (
            self._current_session.session_id if self._current_session else f"sess-{int(now.timestamp() * 1000)}"
        )

        session = Session(
            session_id=session_id,
            user_id="user-default",
            created_at=self._current_session.created_at if self._current_session else now,
            last_active_at=now,
            active_state=route_target.initial_state,
            context={
                "trigger_source": event.source.value,
                "target_route": route_target.target_route,
                "capabilities": event.capabilities,
                "payload": event.payload,
            }
        )
        self._current_session = session
        return session

    def cancel(self) -> Optional[Session]:
        if self._current_session:
            self._current_session.active_state = AgentState.IDLE
            self._current_session.last_active_at = datetime.now(timezone.utc)
            self._current_session.context["cancelled"] = True
        return self._current_session

    def get_current_session(self) -> Optional[Session]:
        return self._current_session


wake_up_orchestrator = WakeUpOrchestrator()
