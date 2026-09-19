import pytest
from app.modules.orchestration.intent_router import IntentRouter


def test_intent_routing_examples():
    """Validates all example queries from Prompt 15."""
    assert IntentRouter.route("What’s my next meeting?")["intent"] == "NEXT_MEETING"
    assert IntentRouter.route("Is my presentation information still correct?")["intent"] == "VERIFY_INFORMATION"
    assert IntentRouter.route("What changed?")["intent"] == "WHAT_CHANGED"
    assert IntentRouter.route("Why?")["intent"] == "WHY"
    assert IntentRouter.route("What does this affect?")["intent"] == "WHAT_AFFECTS"
    assert IntentRouter.route("Fix it.")["intent"] == "FIX_IT"
    assert IntentRouter.route("Cancel")["intent"] == "CANCEL"
    assert IntentRouter.route("Help me")["intent"] == "HELP"


def test_bhupathi_commitment_extension_point_isolation():
    """Rule: Do NOT implement commitment extraction; leave COMMITMENT_EXTRACT as extension point."""
    res = IntentRouter.route("I promised to deliver the updated slides tomorrow")
    assert res["intent"] == "COMMITMENT_EXTRACT"
    assert res.get("is_bhupathi_extension_point") is True


def test_text_and_speech_equivalence():
    """Text input and speech transcript produce identical intent targets."""
    speech_query = "is my presentation information still correct"
    typed_query = "IS MY PRESENTATION INFORMATION STILL CORRECT?"

    res1 = IntentRouter.route(speech_query)
    res2 = IntentRouter.route(typed_query)

    assert res1["intent"] == res2["intent"] == "VERIFY_INFORMATION"
