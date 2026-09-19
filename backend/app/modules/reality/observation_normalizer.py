import re
from typing import Dict, Any, List, Optional
from app.modules.reality.normalizer import RealityNormalizer


class ObservationNormalizer:
    """
    Extracts room entities, detects multiple/ambiguous rooms, and calculates confidence.
    """

    ROOM_PATTERN = re.compile(r'(?:room|hall|audi|auditorium|seminar hall|lab)?\s*[-#]?\s*([0-9]{1,4}[a-zA-Z]?|[a-zA-Z]\b)', re.IGNORECASE)

    @classmethod
    def canonicalize_room(cls, raw: str) -> str:
        return RealityNormalizer.normalize_room(raw)

    @classmethod
    def extract_from_text(cls, raw_text: str, base_confidence: float = 0.95) -> Dict[str, Any]:
        trimmed = (raw_text or "").strip()
        if not trimmed:
            return {
                "raw_text": "",
                "location": None,
                "is_ambiguous": False,
                "candidate_rooms": [],
                "confidence": 0.0,
                "notice_type": "GENERAL"
            }

        lower = trimmed.lower()
        if any(w in lower for w in ["cancel", "postpone", "called off"]):
            return {
                "raw_text": trimmed,
                "location": None,
                "is_ambiguous": False,
                "candidate_rooms": [],
                "confidence": base_confidence,
                "notice_type": "CANCELLATION"
            }

        has_ambiguity = bool(re.search(r'\b(or|either|check with|tbd|tentative)\b', lower))

        # Check directional moved to pattern
        moved_match = re.search(
            r'(?:moved|shifted|relocated|transferred|changed)\s+(?:from\s+(.*?)\s+)?to\s+([A-Za-z0-9\s#-]+)',
            trimmed,
            re.IGNORECASE
        )
        if moved_match and not has_ambiguity:
            from_part = moved_match.group(1)
            to_part = moved_match.group(2)

            to_rooms = cls._find_all_rooms(to_part)
            from_rooms = cls._find_all_rooms(from_part) if from_part else []

            if len(to_rooms) == 1:
                to_room = to_rooms[0]
                from_room = from_rooms[0] if from_rooms else None
                candidates = [from_room, to_room] if from_room else [to_room]
                return {
                    "raw_text": trimmed,
                    "location": to_room,
                    "previous_location": from_room,
                    "is_ambiguous": False,
                    "candidate_rooms": candidates,
                    "confidence": base_confidence,
                    "notice_type": "ROOM_CHANGE"
                }

        candidate_rooms = cls._find_all_rooms(trimmed)
        has_ambiguity = bool(re.search(r'\b(or|either|check with|tbd|tentative)\b', lower))

        if not candidate_rooms:
            return {
                "raw_text": trimmed,
                "location": None,
                "is_ambiguous": False,
                "candidate_rooms": [],
                "confidence": min(base_confidence, 0.35),
                "notice_type": "GENERAL"
            }

        if len(candidate_rooms) == 1:
            return {
                "raw_text": trimmed,
                "location": candidate_rooms[0],
                "is_ambiguous": False,
                "candidate_rooms": candidate_rooms,
                "confidence": base_confidence,
                "notice_type": "ROOM_CHANGE"
            }

        # Multiple rooms with ambiguous phrasing
        if has_ambiguity or len(candidate_rooms) > 2:
            return {
                "raw_text": trimmed,
                "location": None,
                "is_ambiguous": True,
                "candidate_rooms": candidate_rooms,
                "confidence": min(base_confidence * 0.5, 0.48),  # drops below review threshold 0.7
                "notice_type": "ROOM_CHANGE"
            }

        # 2 rooms without explicit "moved to", pick second as destination
        return {
            "raw_text": trimmed,
            "location": candidate_rooms[-1],
            "previous_location": candidate_rooms[0],
            "is_ambiguous": False,
            "candidate_rooms": candidate_rooms,
            "confidence": base_confidence * 0.85,
            "notice_type": "ROOM_CHANGE"
        }

    @classmethod
    def _find_all_rooms(cls, text: str) -> List[str]:
        if not text:
            return []
        found = []
        seen = set()

        # Look specifically for room patterns like Room 302, Hall B, Audi 1, or 3-digit numbers
        matches = re.finditer(r'(?:room|hall|audi|auditorium|lab)\s*[-#]?\s*([0-9]{1,4}[a-zA-Z]?|[a-zA-Z]\b)|\b([0-9]{3}[a-zA-Z]?)\b', text, re.IGNORECASE)
        for m in matches:
            full_match = m.group(0)
            canonical = cls.canonicalize_room(full_match)
            if canonical not in seen:
                seen.add(canonical)
                found.append(canonical)
        return found
