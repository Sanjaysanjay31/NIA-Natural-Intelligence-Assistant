from typing import Dict, Any, Optional
import re


class IntentRouter:
    """
    Deterministic query routing engine for voice and text commands.
    Strictly isolates Bhupathi's commitment extraction module as an extension point.
    """

    SUPPORTED_INTENTS = [
        "NEXT_MEETING",
        "VERIFY_INFORMATION",
        "WHAT_CHANGED",
        "WHY",
        "WHAT_AFFECTS",
        "FIX_IT",
        "CANCEL",
        "HELP",
        "COMMITMENT_EXTRACT"
    ]

    @classmethod
    def route(cls, input_text: str) -> Dict[str, Any]:
        text = (input_text or "").strip().lower()

        if not text:
            return {"intent": "HELP", "confidence": 0.0, "raw_input": input_text}

        if text in ["cancel", "stop", "nevermind", "dismiss"] or "abort" in text:
            return {"intent": "CANCEL", "confidence": 0.99, "raw_input": input_text}

        if text in ["fix it", "fix", "update", "apply change"] or "fix it" in text:
            return {"intent": "FIX_IT", "confidence": 0.98, "raw_input": input_text}

        if text in ["why", "why?"] or "why did it change" in text or "reason" in text:
            return {"intent": "WHY", "confidence": 0.96, "raw_input": input_text}

        if text in ["what changed", "what changed?"] or "what moved" in text or "difference" in text:
            return {"intent": "WHAT_CHANGED", "confidence": 0.96, "raw_input": input_text}

        if "what does this affect" in text or "impact" in text or "who is affected" in text:
            return {"intent": "WHAT_AFFECTS", "confidence": 0.95, "raw_input": input_text}

        if any(kw in text for kw in ["still correct", "is my presentation", "verify", "check reality", "is it true"]):
            return {
                "intent": "VERIFY_INFORMATION",
                "confidence": 0.95,
                "raw_input": input_text,
                "parameters": {"entity": "Final Presentation"}
            }

        if any(kw in text for kw in ["next meeting", "schedule", "what do i have", "calendar", "upcoming"]):
            return {"intent": "NEXT_MEETING", "confidence": 0.94, "raw_input": input_text}

        # Bhupathi Extension Point
        if any(kw in text for kw in ["promise", "will deliver", "commitment", "voice memo"]):
            return {
                "intent": "COMMITMENT_EXTRACT",
                "confidence": 0.92,
                "raw_input": input_text,
                "is_bhupathi_extension_point": True
            }

        return {"intent": "HELP", "confidence": 0.60, "raw_input": input_text}
