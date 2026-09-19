from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from app.modules.digital_state.models import NormalizedEvent
from app.modules.digital_state.adapters import CalendarAdapter, LocalDemoCalendarAdapter


class DigitalStateProvider:
    """
    Independent Digital Ground Truth Provider feeding VEYRA X.
    Enforces permission guardrails: Never claims access if permission is absent.
    """

    def __init__(self, adapter: Optional[CalendarAdapter] = None):
        self.adapter = adapter or LocalDemoCalendarAdapter()
        self.permission_granted: bool = True  # Demo defaults to true, toggleable for testing
        self.last_sync_timestamp: datetime = datetime.now(timezone.utc)

    def set_permission(self, granted: bool):
        self.permission_granted = granted

    def get_permission_explanation(self) -> Dict[str, str]:
        """
        Explains why NIA needs calendar access before the user decides.
        """
        return {
            "title": "Reality Verification Access",
            "message": (
                "NIA connects to your calendar to continuously verify 'Is what I know still true?' "
                "against physical evidence like room change posters or schedule boards."
            ),
            "impact": (
                "NIA will never silently alter your calendar. Any proposed update requires "
                "your explicit gate approval."
            ),
        }

    def handle_permission_choice(self, user_choice: str) -> bool:
        """
        Two-step permission flow:
        1. Explain why NIA needs calendar access
        2. User chooses Allow or Not Now
        3. Only then request permission.
        Never claim access if permission is absent.
        """
        if user_choice.upper() == "ALLOW":
            self.permission_granted = True
            return True
        else:
            self.permission_granted = False
            return False

    def is_sync_stale(self, max_stale_seconds: int = 7200) -> bool:
        """Check if last sync timestamp is older than threshold (2 hours default)."""
        age = (datetime.now(timezone.utc) - self.last_sync_timestamp).total_seconds()
        return age > max_stale_seconds

    def normalize_event(self, raw_event: Dict[str, Any]) -> NormalizedEvent:
        """Expose normalization independent of UI."""
        return self.adapter.normalize_event(raw_event)

    def deduplicate_events(self, events: List[NormalizedEvent]) -> List[NormalizedEvent]:
        """Deduplicate events while preserving order."""
        seen = set()
        deduped = []
        for ev in events:
            key = ev.id
            if key not in seen:
                seen.add(key)
                deduped.append(ev)
        return deduped

    async def get_upcoming_events(self) -> List[NormalizedEvent]:
        # Guardrail: Never claim access if permission is absent
        if not self.permission_granted:
            raise PermissionError("CALENDAR_PERMISSION_DENIED: Calendar permission has not been granted by user.")
        events = await self.adapter.get_upcoming_events()
        return self.deduplicate_events(events)

    async def get_event_by_id(self, event_id: str) -> Optional[NormalizedEvent]:
        if not self.permission_granted:
            raise PermissionError("CALENDAR_PERMISSION_DENIED: Calendar permission has not been granted by user.")
        return await self.adapter.get_event_by_id(event_id)

    async def refresh_events(self) -> List[NormalizedEvent]:
        if not self.permission_granted:
            raise PermissionError("CALENDAR_PERMISSION_DENIED: Calendar permission has not been granted by user.")
        events = await self.adapter.refresh_events()
        self.last_sync_timestamp = datetime.now(timezone.utc)
        return self.deduplicate_events(events)


digital_state_provider = DigitalStateProvider()
