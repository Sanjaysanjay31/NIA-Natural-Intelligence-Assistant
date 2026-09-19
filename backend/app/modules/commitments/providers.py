import json
import logging
from abc import ABC, abstractmethod
from typing import Optional, Callable, Dict, Any, List
from pydantic import ValidationError

from app.modules.commitments.schemas import (
    Commitment,
    CommitmentExtractionRequest,
    CommitmentExtractionResponse,
)
from app.modules.commitments.extractor import CommitmentExtractor

logger = logging.getLogger(__name__)


class CommitmentExtractorProvider(ABC):
    """Abstract base provider for commitment extraction engines."""

    @abstractmethod
    def extract(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        """Extract commitments from request returning standardized domain response."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Returns whether this provider is currently available and ready for inference."""
        pass

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Name/type of the provider (e.g., 'RULE_BASED', 'LOCAL_LLM')."""
        pass


class RuleBasedCommitmentExtractor(CommitmentExtractorProvider):
    """Guaranteed fallback extractor using deterministic rule-based parsing.
    
    Always available, zero heavy weights, 100% Render compliant.
    """

    def __init__(self, extractor: Optional[CommitmentExtractor] = None):
        self._extractor = extractor or CommitmentExtractor()

    def extract(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        response = self._extractor.extract(request)
        response.metadata["provider"] = self.provider_type
        return response

    @property
    def is_available(self) -> bool:
        return True

    @property
    def provider_type(self) -> str:
        return "RULE_BASED"


class LocalLLMCommitmentExtractor(CommitmentExtractorProvider):
    """Optional on-device small language model (SLM) extractor.
    
    Guarantees:
    - Runs exclusively on mobile device hardware.
    - No multi-GB model weights in Git or loaded in cloud RAM.
    - Output is strictly validated against Pydantic domain schemas.
    - Malformed or invalid schema output automatically falls back to rule-based engine.
    - Uncertain output receives discounted confidence.
    """

    def __init__(
        self,
        llm_callable: Optional[Callable[[str], str]] = None,
        available: bool = False,
        fallback_extractor: Optional[CommitmentExtractorProvider] = None,
    ):
        self._llm_callable = llm_callable
        self._available = available
        self._fallback = fallback_extractor or RuleBasedCommitmentExtractor()

    def set_availability(self, available: bool):
        self._available = available

    def set_llm_callable(self, llm_callable: Optional[Callable[[str], str]]):
        self._llm_callable = llm_callable

    @property
    def is_available(self) -> bool:
        return self._available and self._llm_callable is not None

    @property
    def provider_type(self) -> str:
        return "LOCAL_LLM"

    def extract(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        if not self.is_available:
            logger.info("Local LLM not available on device, delegating to rule-based provider.")
            fallback_res = self._fallback.extract(request)
            fallback_res.metadata["fallback_reason"] = "LOCAL_LLM_UNAVAILABLE"
            return fallback_res

        try:
            raw_output = self._llm_callable(request.transcript)  # type: ignore[misc]
            parsed_data = json.loads(raw_output)

            # Validate against Pydantic schema
            if isinstance(parsed_data, list):
                commitments = [Commitment.model_validate(item) for item in parsed_data]
            elif isinstance(parsed_data, dict) and "commitments" in parsed_data:
                commitments = [Commitment.model_validate(item) for item in parsed_data["commitments"]]
            else:
                raise ValueError("LLM response format must be an array or object containing 'commitments'")

            # Check uncertainty discount
            for cmt in commitments:
                # If LLM flagged uncertainty or low confidence, ensure confidence is adjusted
                if cmt.metadata.get("uncertain", False) or cmt.confidence < 0.70:
                    cmt.confidence = min(cmt.confidence, 0.65)

                # Ensure deadline is not fabricated if transcript didn't contain temporal markers
                if cmt.deadline and not any(
                    token in request.transcript.lower()
                    for token in [
                        "friday", "monday", "tuesday", "wednesday", "thursday",
                        "saturday", "sunday", "tomorrow", "tonight", "next week",
                        "at", "pm", "am", "by", "before"
                    ]
                ):
                    # Strip fabricated deadline
                    cmt.deadline = None

            avg_conf = (
                round(sum(c.confidence for c in commitments) / len(commitments), 2)
                if commitments
                else 1.0
            )

            return CommitmentExtractionResponse(
                commitments=commitments,
                extraction_count=len(commitments),
                confidence=avg_conf,
                raw_transcript=request.transcript,
                metadata={
                    "provider": self.provider_type,
                    "model_source": "phone_local_slm",
                    "validated": True,
                },
            )

        except (json.JSONDecodeError, ValidationError, ValueError, Exception) as exc:
            logger.warning(f"Local LLM extraction failed validation ({exc}). Falling back to rules.")
            fallback_res = self._fallback.extract(request)
            fallback_res.metadata["fallback_reason"] = f"LLM_VALIDATION_ERROR: {str(exc)}"
            return fallback_res


class CompositeCommitmentExtractor(CommitmentExtractorProvider):
    """Unified provider implementing the selection policy:
    - If local model is available on device -> use LocalLLMCommitmentExtractor
    - Otherwise -> use RuleBasedCommitmentExtractor
    """

    def __init__(
        self,
        rule_extractor: Optional[RuleBasedCommitmentExtractor] = None,
        local_llm_extractor: Optional[LocalLLMCommitmentExtractor] = None,
    ):
        self.rule_extractor = rule_extractor or RuleBasedCommitmentExtractor()
        self.local_llm_extractor = local_llm_extractor or LocalLLMCommitmentExtractor(
            fallback_extractor=self.rule_extractor
        )

    @property
    def is_available(self) -> bool:
        return True

    @property
    def provider_type(self) -> str:
        if self.local_llm_extractor.is_available:
            return "COMPOSITE (ACTIVE: LOCAL_LLM)"
        return "COMPOSITE (ACTIVE: RULE_BASED)"

    def extract(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        # Selection Policy
        if self.local_llm_extractor.is_available:
            return self.local_llm_extractor.extract(request)
        return self.rule_extractor.extract(request)


# Default singleton composite extractor
composite_commitment_extractor = CompositeCommitmentExtractor()
