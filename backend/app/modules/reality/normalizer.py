import re
from typing import Optional


class RealityNormalizer:
    """
    Deterministic normalizer canonicalizing multi-modal values
    (rooms, dates, times, entity names) into comparable representations.
    """

    @staticmethod
    def normalize_text(text: Optional[str]) -> str:
        if not text:
            return ""
        # Lowercase, normalize whitespace
        clean = re.sub(r"\s+", " ", text.strip())
        return clean

    @staticmethod
    def normalize_room(room_str: Optional[str]) -> str:
        """
        Canonicalize room strings:
        'Room 204', 'room 204', 'ROOM-204', 'Rm. 204', 'room: 204' -> 'Room 204'
        """
        if not room_str:
            return ""

        raw = room_str.strip()
        # Look for pattern room/rm followed by separator and room number/identifier
        match = re.search(r"(?:room|rm)[\s.:#-]*([a-zA-Z0-9]+)", raw, re.IGNORECASE)
        if match:
            room_num = match.group(1).upper()
            return f"Room {room_num}"

        # If it's just a number or code e.g. "204" or "302B"
        match_num = re.search(r"^[a-zA-Z]?\d+[a-zA-Z]?$", raw)
        if match_num:
            return f"Room {raw.upper()}"

        return RealityNormalizer.normalize_text(raw).title()

    @staticmethod
    def normalize_time(time_str: Optional[str]) -> str:
        """
        Canonicalize time strings:
        '09:00', '9:00 AM', '09:00:00', '9 AM' -> '09:00'
        """
        if not time_str:
            return ""

        raw = time_str.strip()
        match = re.search(r"(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?", raw, re.IGNORECASE)
        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            meridiem = match.group(3)
            if meridiem:
                if meridiem.lower() == "pm" and hours < 12:
                    hours += 12
                elif meridiem.lower() == "am" and hours == 12:
                    hours = 0
            return f"{hours:02d}:{minutes:02d}"

        # Matches '9 AM' or '2 PM'
        match_simple = re.search(r"(\d{1,2})\s*(am|pm)", raw, re.IGNORECASE)
        if match_simple:
            hours = int(match_simple.group(1))
            meridiem = match_simple.group(2).lower()
            if meridiem == "pm" and hours < 12:
                hours += 12
            elif meridiem == "am" and hours == 12:
                hours = 0
            return f"{hours:02d}:00"

        return raw.strip()

    @staticmethod
    def are_rooms_equal(room_a: Optional[str], room_b: Optional[str]) -> bool:
        if not room_a or not room_b:
            return False
        return RealityNormalizer.normalize_room(room_a) == RealityNormalizer.normalize_room(room_b)

    @staticmethod
    def are_times_equal(time_a: Optional[str], time_b: Optional[str]) -> bool:
        if not time_a or not time_b:
            return False
        return RealityNormalizer.normalize_time(time_a) == RealityNormalizer.normalize_time(time_b)
