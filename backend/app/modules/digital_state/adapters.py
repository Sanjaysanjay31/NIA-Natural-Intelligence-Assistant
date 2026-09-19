from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from app.modules.digital_state.models import NormalizedEvent
from app.modules.reality.normalizer import RealityNormalizer


class CalendarAdapter(ABC):
    """Abstract interface defining operations for Calendar integrations."""

    @abstractmethod
    async def get_upcoming_events(self) -> List[NormalizedEvent]:
        pass

    @abstractmethod
    async def get_event_by_id(self, event_id: str) -> Optional[NormalizedEvent]:
        pass

    @abstractmethod
    async def refresh_events(self) -> List[NormalizedEvent]:
        pass

    @abstractmethod
    def normalize_event(self, raw_event: Dict[str, Any]) -> NormalizedEvent:
        pass


class LocalDemoCalendarAdapter(CalendarAdapter):
    """
    Deterministic Local Calendar Adapter pre-seeded with the primary hackathon story:
    Final Presentation at 09:00 in Room 204.
    """

    def __init__(self):
        self._events: Dict[str, NormalizedEvent] = {}
        self._seed_deterministic_demo()

    def _seed_deterministic_demo(self):
        now = datetime.now(timezone.utc)
        start_time = now.replace(hour=9, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=1)

        demo_event = NormalizedEvent(
            id="evt-final-presentation",
            title="Final Presentation",
            start=start_time,
            end=end_time,
            location="Room 204",
            source="google_calendar",
            last_synced_at=now,
            metadata={"calendarId": "primary", "attendees": ["team@nia.ai", "prof.sharma@univ.edu"]}
        )
        self._events[demo_event.id] = demo_event

    def normalize_event(self, raw_event: Dict[str, Any]) -> NormalizedEvent:
        """Parse arbitrary raw calendar payload into NormalizedEvent with timezone handling."""
        raw_start = raw_event.get("start")
        raw_end = raw_event.get("end")

        if isinstance(raw_start, str):
            start_dt = datetime.fromisoformat(raw_start.replace("Z", "+00:00"))
        elif isinstance(raw_start, datetime):
            start_dt = raw_start
        else:
            start_dt = datetime.now(timezone.utc)

        # Enforce UTC timezone awareness
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)

        if isinstance(raw_end, str):
            end_dt = datetime.fromisoformat(raw_end.replace("Z", "+00:00"))
        elif isinstance(raw_end, datetime):
            end_dt = raw_end
        else:
            end_dt = start_dt + timedelta(hours=1)

        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)

        norm_location = RealityNormalizer.normalize_room(raw_event.get("location")) if raw_event.get("location") else None

        return NormalizedEvent(
            id=str(raw_event.get("id", f"evt-{raw_event.get('title', 'event')}")),
            title=str(raw_event.get("title", "Untitled Event")),
            start=start_dt,
            end=end_dt,
            location=norm_location,
            source=str(raw_event.get("source", "calendar_adapter")),
            last_synced_at=datetime.now(timezone.utc),
            metadata=raw_event.get("metadata", {})
        )

    async def get_upcoming_events(self) -> List[NormalizedEvent]:
        return list(self._events.values())

    async def get_event_by_id(self, event_id: str) -> Optional[NormalizedEvent]:
        return self._events.get(event_id)

    async def refresh_events(self) -> List[NormalizedEvent]:
        # Refreshes last_synced_at timestamp on stored events
        now = datetime.now(timezone.utc)
        for ev in self._events.values():
            ev.last_synced_at = now
        return list(self._events.values())

    def update_event_location(self, event_id: str, new_location: str) -> Optional[NormalizedEvent]:
        ev = self._events.get(event_id)
        if not ev:
            return None
        ev.location = RealityNormalizer.normalize_room(new_location)
        ev.last_synced_at = datetime.now(timezone.utc)
        return ev


class NativeCalendarAdapter(CalendarAdapter):
    """
    Isolated Android Native Calendar integration boundary.
    Never claims access if platform permission has not been granted.
    """

    def __init__(self, has_permission: bool = False):
        self._has_permission = has_permission
        self._events: Dict[str, NormalizedEvent] = {}

    def set_permission(self, granted: bool):
        self._has_permission = granted

    def normalize_event(self, raw_event: Dict[str, Any]) -> NormalizedEvent:
        return LocalDemoCalendarAdapter().normalize_event(raw_event)

    async def get_upcoming_events(self) -> List[NormalizedEvent]:
        if not self._has_permission:
            raise PermissionError("Native Android calendar permission not granted.")
        return list(self._events.values())

    async def get_event_by_id(self, event_id: str) -> Optional[NormalizedEvent]:
        if not self._has_permission:
            raise PermissionError("Native Android calendar permission not granted.")
        return self._events.get(event_id)

    async def refresh_events(self) -> List[NormalizedEvent]:
        if not self._has_permission:
            raise PermissionError("Native Android calendar permission not granted.")
        return list(self._events.values())


class MockCalendarAdapter(CalendarAdapter):
    """
    Remote/Mock Calendar Adapter strictly for unit and integration testing.
    """

    def __init__(self, initial_events: Optional[List[NormalizedEvent]] = None):
        self._events: Dict[str, NormalizedEvent] = {}
        if initial_events:
            for ev in initial_events:
                self._events[ev.id] = ev

    def add_event(self, event: NormalizedEvent):
        self._events[event.id] = event

    def normalize_event(self, raw_event: Dict[str, Any]) -> NormalizedEvent:
        return LocalDemoCalendarAdapter().normalize_event(raw_event)

    async def get_upcoming_events(self) -> List[NormalizedEvent]:
        return list(self._events.values())

    async def get_event_by_id(self, event_id: str) -> Optional[NormalizedEvent]:
        return self._events.get(event_id)

    async def refresh_events(self) -> List[NormalizedEvent]:
        now = datetime.now(timezone.utc)
        for ev in self._events.values():
            ev.last_synced_at = now
        return list(self._events.values())

