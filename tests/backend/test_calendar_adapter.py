import asyncio
from datetime import datetime, timezone, timedelta
import pytest
from app.modules.digital_state.models import NormalizedEvent
from app.modules.digital_state.adapters import (
    LocalDemoCalendarAdapter,
    NativeCalendarAdapter,
    MockCalendarAdapter,
)
from app.modules.digital_state.provider import DigitalStateProvider


def test_seed_deterministic_demo_event_found():
    """Test 1: Event found - Pre-seeded Final Presentation at 09:00 in Room 204 exists."""
    adapter = LocalDemoCalendarAdapter()
    provider = DigitalStateProvider(adapter=adapter)

    events = asyncio.run(provider.get_upcoming_events())
    assert len(events) >= 1
    demo = asyncio.run(provider.get_event_by_id("evt-final-presentation"))
    assert demo is not None
    assert demo.title == "Final Presentation"
    assert demo.location == "Room 204"
    assert demo.start.hour == 9
    assert demo.start.minute == 0


def test_no_event():
    """Test 2: No event - Querying a non-existent event ID returns None."""
    adapter = LocalDemoCalendarAdapter()
    provider = DigitalStateProvider(adapter=adapter)

    ev = asyncio.run(provider.get_event_by_id("evt-does-not-exist-999"))
    assert ev is None


def test_permission_denied():
    """Test 3: Permission denied - Never claim access if permission is absent."""
    adapter = LocalDemoCalendarAdapter()
    provider = DigitalStateProvider(adapter=adapter)

    # Deny permission
    provider.set_permission(False)
    assert provider.permission_granted is False

    with pytest.raises(PermissionError) as exc_upcoming:
        asyncio.run(provider.get_upcoming_events())
    assert "CALENDAR_PERMISSION_DENIED" in str(exc_upcoming.value)

    with pytest.raises(PermissionError) as exc_id:
        asyncio.run(provider.get_event_by_id("evt-final-presentation"))
    assert "CALENDAR_PERMISSION_DENIED" in str(exc_id.value)

    with pytest.raises(PermissionError) as exc_refresh:
        asyncio.run(provider.refresh_events())
    assert "CALENDAR_PERMISSION_DENIED" in str(exc_refresh.value)

    # Native adapter permission check isolation
    native_adapter = NativeCalendarAdapter(has_permission=False)
    with pytest.raises(PermissionError):
        asyncio.run(native_adapter.get_upcoming_events())


def test_duplicate_event():
    """Test 4: Duplicate event - Deduplicate repeated entries."""
    mock_adapter = MockCalendarAdapter()
    now = datetime.now(timezone.utc)
    ev1 = NormalizedEvent(
        id="evt-dup-1",
        title="Duplicate Test",
        start=now,
        end=now + timedelta(hours=1),
        location="Room 101"
    )
    # Intentionally add duplicate
    mock_adapter.add_event(ev1)
    provider = DigitalStateProvider(adapter=mock_adapter)

    events = [ev1, ev1, ev1]
    deduped = provider.deduplicate_events(events)
    assert len(deduped) == 1
    assert deduped[0].id == "evt-dup-1"


def test_timezone_handling():
    """Test 5: Timezone handling - Correct parsing and UTC normalization."""
    adapter = LocalDemoCalendarAdapter()

    # Case A: ISO string with UTC 'Z'
    raw_z = {
        "id": "tz-1",
        "title": "UTC Z Meeting",
        "start": "2026-09-19T09:00:00Z",
        "end": "2026-09-19T10:00:00Z",
        "location": "Room 204"
    }
    event_z = adapter.normalize_event(raw_z)
    assert event_z.start.tzinfo is not None
    assert event_z.start.utcoffset() == timedelta(0)
    assert event_z.start.hour == 9

    # Case B: ISO string with positive offset (+05:30 IST)
    raw_ist = {
        "id": "tz-2",
        "title": "IST Meeting",
        "start": "2026-09-19T14:30:00+05:30",
        "end": "2026-09-19T15:30:00+05:30",
        "location": "Lab 1"
    }
    event_ist = adapter.normalize_event(raw_ist)
    assert event_ist.start.tzinfo is not None
    # 14:30 +05:30 is 09:00 UTC
    utc_dt = event_ist.start.astimezone(timezone.utc)
    assert utc_dt.hour == 9
    assert utc_dt.minute == 0


def test_location_missing():
    """Test 6: Location missing - Handled cleanly as None without crashing."""
    adapter = LocalDemoCalendarAdapter()
    raw_no_loc = {
        "id": "no-loc-1",
        "title": "Virtual Standup",
        "start": "2026-09-19T11:00:00Z",
        "end": "2026-09-19T11:30:00Z",
        # location omitted
    }
    event = adapter.normalize_event(raw_no_loc)
    assert event.location is None
    assert event.title == "Virtual Standup"


def test_stale_sync():
    """Test 7: Stale sync - Flag when last sync exceeds threshold."""
    provider = DigitalStateProvider()

    # Artificially age sync timestamp to 3 hours ago (10800s > 7200s threshold)
    provider.last_sync_timestamp = datetime.now(timezone.utc) - timedelta(seconds=10800)
    assert provider.is_sync_stale(max_stale_seconds=7200) is True

    # Refresh events updates timestamp
    asyncio.run(provider.refresh_events())
    assert provider.is_sync_stale(max_stale_seconds=7200) is False


def test_changed_event():
    """Test 8: Changed event - Dynamic location change reflected immediately."""
    adapter = LocalDemoCalendarAdapter()
    provider = DigitalStateProvider(adapter=adapter)

    # Initial state
    event = asyncio.run(provider.get_event_by_id("evt-final-presentation"))
    assert event.location == "Room 204"

    # Reality shift / event updated: Room 204 -> Room 302
    updated = adapter.update_event_location("evt-final-presentation", "Room 302")
    assert updated is not None
    assert updated.location == "Room 302"

    # Verified via provider
    re_fetched = asyncio.run(provider.get_event_by_id("evt-final-presentation"))
    assert re_fetched.location == "Room 302"
