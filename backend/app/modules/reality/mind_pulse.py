import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.modules.reality.normalizer import RealityNormalizer


class MindPulseExtractor:
    """
    Deterministic extraction of visible screen text.
    Extracts: events, commitments, locations, deadlines, tasks, people, decisions.
    Invariant: Zero LLM dependency for basic entity identification and room/time comparison.
    """

    KNOWN_EVENTS = [
        "Final Presentation", "Presentation", "Symposium", "Faculty Meeting",
        "Workshop", "Standup", "Exam", "Lecture"
    ]
    KNOWN_PEOPLE = ["Prof. Sharma", "Dr. Rao", "Sanjay", "Bhupathi", "HOD"]

    @classmethod
    def extract(cls, raw_text: str, base_confidence: float = 0.95) -> Dict[str, Any]:
        text = (raw_text or "").strip()
        if not text:
            return {
                "events": [],
                "commitments": [],
                "locations": [],
                "deadlines": [],
                "tasks": [],
                "people": [],
                "decisions": [],
                "confidence": 0.0,
                "raw_text": ""
            }

        locations = cls._extract_locations(text)
        events = [ev for ev in cls.KNOWN_EVENTS if re.search(rf'\b{re.escape(ev)}\b', text, re.I)]
        people = [p for p in cls.KNOWN_PEOPLE if re.search(rf'\b{re.escape(p)}\b', text, re.I)]

        deadlines = re.findall(r'\b(?:[0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:am|pm)?\b|\b(?:today|tomorrow|monday|next week)\b', text, re.I)
        tasks = re.findall(r'(?:task|action|todo|bring|prepare|send)\s*[:\-]?\s*([^.!\n]+)', text, re.I)
        decisions = re.findall(r'(?:moved to|shifted to|postponed until|cancelled|approved|decided to)\s*([^.!\n]+)', text, re.I)
        commitments = re.findall(r'(?:will|promise to|going to|must|mandatory to)\s+([^.!\n]+)', text, re.I)

        confidence = base_confidence
        if not locations and not events:
            confidence = min(confidence, 0.40)
        if any(w in text.lower() for w in ["obscured", "smudge", "...", "unclear"]):
            confidence = min(confidence, 0.48)  # Triggers "Needs review"

        return {
            "events": events,
            "commitments": [c.strip() for c in commitments],
            "locations": locations,
            "deadlines": [d.strip() for d in deadlines],
            "tasks": [t.strip() for t in tasks],
            "people": people,
            "decisions": [d.strip() for d in decisions],
            "confidence": confidence,
            "raw_text": text
        }

    @classmethod
    def _extract_locations(cls, text: str) -> List[str]:
        matches = re.finditer(r'(?:room|hall|audi|auditorium|lab)\s*[-#]?\s*([0-9]{1,4}[a-zA-Z]?|[a-zA-Z]\b)|\b([0-9]{3}[a-zA-Z]?)\b', text, re.I)
        found = []
        seen = set()
        for m in matches:
            canonical = RealityNormalizer.normalize_room(m.group(0))
            if canonical not in seen:
                seen.add(canonical)
                found.append(canonical)
        return found


class MindPulseVerifier:
    """
    Compares visible screen context against NIA digital ground truth.
    Deterministic logic first — zero LLM requirement for room/time comparison.
    """

    @classmethod
    def verify(
        cls,
        extracted: Dict[str, Any],
        digital_location: str = "Room 204",
        digital_time: str = "09:00 AM"
    ) -> Dict[str, Any]:
        confidence = extracted.get("confidence", 0.0)
        locations = extracted.get("locations", [])
        raw_text = extracted.get("raw_text", "").lower()

        is_cancellation = any(w in raw_text for w in ["cancel", "postpone", "called off"])

        if confidence < 0.60 or (not locations and not is_cancellation):
            return {
                "status": "NEEDS_REVIEW",
                "headline": "Uncertain Screen Content — Needs Review",
                "summary": "Screen text was partially obscured or ambiguous. Manual review required.",
                "requires_review": True,
                "confidence": confidence
            }

        if is_cancellation:
            return {
                "status": "DRIFT",
                "headline": "Schedule Drift: Event Cancelled / Postponed",
                "summary": "Screen notification indicates the presentation has been postponed.",
                "requires_review": False,
                "confidence": confidence
            }

        observed_loc = locations[0]
        norm_obs = RealityNormalizer.normalize_room(observed_loc)
        norm_dig = RealityNormalizer.normalize_room(digital_location)

        if norm_obs != norm_dig:
            return {
                "status": "DRIFT",
                "headline": f"Location Drift: {norm_dig} → {norm_obs}",
                "summary": f"Screen mentions {norm_obs}, but your digital calendar still says {norm_dig}.",
                "digital_location": norm_dig,
                "observed_location": norm_obs,
                "requires_review": False,
                "confidence": confidence
            }

        return {
            "status": "VERIFIED",
            "headline": "Ground Truth Verified",
            "summary": f"Screen confirms event at {norm_dig} ({digital_time}).",
            "digital_location": norm_dig,
            "observed_location": norm_obs,
            "requires_review": False,
            "confidence": confidence
        }
