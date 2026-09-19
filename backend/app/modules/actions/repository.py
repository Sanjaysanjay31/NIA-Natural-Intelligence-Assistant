from abc import ABC, abstractmethod
from typing import Dict, Optional, List, Any


class ReminderItem:
    def __init__(self, reminder_id: str, title: str, location: str, scheduled_time: str, notes: Optional[str] = None):
        self.reminder_id = reminder_id
        self.title = title
        self.location = location
        self.scheduled_time = scheduled_time
        self.notes = notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reminderId": self.reminder_id,
            "title": self.title,
            "location": self.location,
            "scheduledTime": self.scheduled_time,
            "notes": self.notes,
        }


class BaseReminderRepository(ABC):
    """Abstract interface defining operations for Android/digital reminder storage."""

    @abstractmethod
    async def get_reminder(self, reminder_id: str) -> Optional[ReminderItem]:
        pass

    @abstractmethod
    async def update_reminder_location(self, reminder_id: str, new_location: str) -> Optional[ReminderItem]:
        pass

    @abstractmethod
    async def list_reminders(self) -> List[ReminderItem]:
        pass


class MockReminderRepository(BaseReminderRepository):
    """
    In-memory reminder repository matching the exact interface
    of the native Android reminder/calendar repository.
    """

    def __init__(self):
        self._reminders: Dict[str, ReminderItem] = {}
        self._seed_default_reminders()

    def _seed_default_reminders(self):
        self._reminders["rem-204"] = ReminderItem(
            reminder_id="rem-204",
            title="Check projector equipment",
            location="Room 204",
            scheduled_time="08:30",
            notes="Equipment check for Final Presentation"
        )

    async def get_reminder(self, reminder_id: str) -> Optional[ReminderItem]:
        return self._reminders.get(reminder_id)

    async def update_reminder_location(self, reminder_id: str, new_location: str) -> Optional[ReminderItem]:
        reminder = self._reminders.get(reminder_id)
        if not reminder:
            return None
        reminder.location = new_location
        reminder.notes = f"Location updated to {new_location} via Safe Action Gate"
        return reminder

    async def list_reminders(self) -> List[ReminderItem]:
        return list(self._reminders.values())


reminder_repository = MockReminderRepository()
