import re
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any

from app.modules.commitments.schemas import (
    Commitment,
    CommitmentEvidence,
    CommitmentStatus,
    CommitmentSource,
    CommitmentExtractionRequest,
    CommitmentExtractionResponse,
)


class CommitmentExtractor:
    """Deterministic, rule-based commitment extraction engine.
    
    Extracts structured personal and interpersonal commitments from conversational
    or voice transcripts without requiring an external heavy LLM runtime.
    """

    # Verbs indicating actionable commitment
    COMMITMENT_VERBS = {
        "submit", "send", "finish", "prepare", "present", "review",
        "complete", "deliver", "email", "share", "draft", "update",
        "build", "organize", "call", "write", "schedule", "provide",
        "upload", "push", "deploy", "fix", "inspect", "create", "test"
    }

    # Temporal patterns for deadlines
    DEADLINE_REGEX = re.compile(
        r"\b(?:by|before|on|at|until|for)?\s*"
        r"(?:(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month))|"
        r"((?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))|"
        r"(tomorrow(?:\s+(?:morning|afternoon|evening|night))?)|"
        r"(tonight)|"
        r"(in\s+\d+\s+(?:hours?|days?|weeks?))|"
        r"(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))|"
        r"(end\s+of\s+(?:day|today|the\s+week|week)))"
        r"(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))?\b",
        re.IGNORECASE
    )

    # Disqualifying question patterns
    QUESTION_STARTERS = re.compile(
        r"^(?:did|can|could|would|will|should|are|is|have|has|do|does)\s+you\b",
        re.IGNORECASE
    )

    # Disqualifying speculative/collective patterns
    SPECULATIVE_PATTERNS = [
        re.compile(r"\bwe\s+should\b", re.IGNORECASE),
        re.compile(r"\bwe\s+could\b", re.IGNORECASE),
        re.compile(r"\bmaybe\s+we\b", re.IGNORECASE),
        re.compile(r"\bwe\s+might\b", re.IGNORECASE),
        re.compile(r"\bwhy\s+don't\s+we\b", re.IGNORECASE),
        re.compile(r"\blet's\s+probably\b", re.IGNORECASE),
    ]

    # Past tense passive or completed patterns
    PAST_TENSE_PATTERNS = [
        re.compile(r"\b(?:were|was|have\s+been|had\s+been)\s+(?:submitted|sent|finished|prepared|reviewed|completed)\b", re.IGNORECASE),
        re.compile(r"\b(?:yesterday|last\s+week|earlier\s+today|already)\b", re.IGNORECASE),
        re.compile(r"\bI\s+(?:submitted|sent|completed|finished)\b", re.IGNORECASE),
    ]

    def extract(self, request: CommitmentExtractionRequest) -> CommitmentExtractionResponse:
        """Main entry point: extracts commitments from plain text transcript."""
        transcript = request.transcript.strip()
        if not transcript:
            return CommitmentExtractionResponse(
                commitments=[],
                extraction_count=0,
                confidence=1.0,
                raw_transcript="",
                metadata={"reason": "Empty transcript"}
            )

        lines_or_sentences = self._split_into_candidate_statements(transcript)
        extracted: List[Commitment] = []
        overall_confidence_sum = 0.0

        for statement, start_char, end_char, speaker_tag in lines_or_sentences:
            if self._is_disqualified(statement):
                continue

            # Check if this statement contains compound separable commitments
            sub_clauses = self._split_compound_commitments(statement, start_char)

            for clause_text, c_start, c_end in sub_clauses:
                parsed = self._extract_single_commitment(
                    clause_text=clause_text,
                    source=request.source,
                    source_id=request.source_id,
                    current_user_name=request.current_user_name or "current_user",
                    known_participants=request.known_participants or [],
                    start_char=c_start,
                    end_char=c_end,
                    speaker_tag=speaker_tag,
                )
                if parsed:
                    extracted.append(parsed)
                    overall_confidence_sum += parsed.confidence

        avg_confidence = round(overall_confidence_sum / len(extracted), 2) if extracted else 1.0

        return CommitmentExtractionResponse(
            commitments=extracted,
            extraction_count=len(extracted),
            confidence=avg_confidence,
            raw_transcript=transcript,
            metadata={
                "candidate_statements_evaluated": len(lines_or_sentences),
                "source": request.source.value,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    def _split_into_candidate_statements(self, text: str) -> List[Tuple[str, int, int, Optional[str]]]:
        """Splits transcript into sentences or dialog lines preserving character offsets."""
        results = []
        # Support speaker prefix e.g., "Sanjay: I will send the slides"
        pattern = re.compile(r"([^.\n!?]+(?:[.\n!?]+|$))")
        for match in pattern.finditer(text):
            stmt = match.group(1).strip()
            if not stmt:
                continue
            start_pos = match.start()
            end_pos = match.end()

            # Check for speaker prefix like "Alice: ..." or "[Bob]: ..."
            speaker = None
            speaker_match = re.match(r"^\[?([A-Za-z0-9_-]+)\]?:\s*(.*)", stmt)
            if speaker_match:
                speaker = speaker_match.group(1)
                stmt = speaker_match.group(2)

            results.append((stmt, start_pos, end_pos, speaker))
        return results

    def _is_disqualified(self, statement: str) -> bool:
        """Filters out questions, speculative suggestions, and past-tense completed events."""
        stmt = statement.strip()
        # Check questions
        if stmt.endswith("?") or self.QUESTION_STARTERS.search(stmt):
            return True

        # Check speculative / collective proposals
        for pattern in self.SPECULATIVE_PATTERNS:
            if pattern.search(stmt):
                return True

        # Check past-tense indicators
        for pattern in self.PAST_TENSE_PATTERNS:
            if pattern.search(stmt):
                return True

        return False

    def _split_compound_commitments(self, statement: str, base_offset: int) -> List[Tuple[str, int, int]]:
        """Splits compound commitments connected by 'and' when both have actionable verbs.
        
        Example:
        'I'll submit the slides Friday and send the report Monday.'
        -> ['I\'ll submit the slides Friday', 'send the report Monday']
        """
        stmt = statement.strip()
        and_match = re.search(r"\band\s+([a-zA-Z]+)\b", stmt, re.IGNORECASE)
        if and_match:
            verb_after_and = and_match.group(1).lower()
            if verb_after_and in self.COMMITMENT_VERBS:
                split_idx = and_match.start()
                part1 = stmt[:split_idx].strip()
                part2 = stmt[split_idx + 4:].strip()  # skip 'and '
                # Ensure part 1 has a verb as well
                if any(v in part1.lower() for v in self.COMMITMENT_VERBS):
                    return [
                        (part1, base_offset, base_offset + split_idx),
                        (part2, base_offset + split_idx + 4, base_offset + len(stmt))
                    ]
        return [(stmt, base_offset, base_offset + len(stmt))]

    def _extract_single_commitment(
        self,
        clause_text: str,
        source: CommitmentSource,
        source_id: Optional[str],
        current_user_name: str,
        known_participants: List[str],
        start_char: int,
        end_char: int,
        speaker_tag: Optional[str] = None,
    ) -> Optional[Commitment]:
        """Extracts owner, action, deadline, and confidence from a single clause."""
        text = clause_text.strip()

        # Extract deadline if present
        deadline_str = None
        deadline_match = self.DEADLINE_REGEX.search(text)
        if deadline_match:
            deadline_str = deadline_match.group(0).strip()
            # Clean up leading 'by', 'on', 'before' if redundant
            deadline_str = re.sub(r"^(?:by|before|on|at)\s+", "", deadline_str, flags=re.IGNORECASE).strip()

        # Identify Owner and Modal Intent
        owner = current_user_name
        confidence = 0.85
        action_text = ""

        # Pattern 1: First person explicit ("I will ...", "I'll ...", "I can ...", "I'm going to ...")
        first_person_match = re.search(
            r"\b(?:I\s+will|I'll|I\s+can|I\s+am\s+going\s+to|I'm\s+going\s+to|I\s+promise\s+to|I\s+plan\s+to)\s+(.*)",
            text,
            re.IGNORECASE
        )

        # Pattern 2: Named 3rd person ("Sanjay will ...", "Priya is going to ...")
        third_person_match = None
        if not first_person_match:
            third_person_match = re.search(
                r"\b([A-Z][a-zA-Z0-9_-]+)\s+(?:will|'ll|is\s+going\s+to|can)\s+(.*)",
                text
            )

        if first_person_match:
            raw_action = first_person_match.group(1).strip()
            # If speaker_tag is available from transcript dialog, owner is the speaker
            owner = speaker_tag if speaker_tag else current_user_name
            action_text = raw_action
            if "can" in text.lower().split()[:3]:
                confidence -= 0.05
            else:
                confidence += 0.05
        elif third_person_match:
            potential_owner = third_person_match.group(1).strip()
            raw_action = third_person_match.group(2).strip()
            owner = potential_owner
            action_text = raw_action
            confidence += 0.05
        elif speaker_tag and any(v in text.lower() for v in self.COMMITMENT_VERBS):
            # Dialog statement spoken by tagged speaker
            owner = speaker_tag
            action_text = text
            confidence = 0.80
        elif any(text.lower().startswith(v) for v in self.COMMITMENT_VERBS):
            # Imperative or continuing clause (e.g. from compound split: "send the report Monday")
            owner = speaker_tag if speaker_tag else current_user_name
            action_text = text
            confidence = 0.85
        else:
            return None

        # Clean action text: remove deadline string if trailing or embedded
        cleaned_action = action_text
        if deadline_str:
            # Strip deadline from action
            cleaned_action = re.sub(re.escape(deadline_str), "", cleaned_action, flags=re.IGNORECASE).strip()
            # Also clean leftover trailing prepositions like 'by', 'on', 'before'
            cleaned_action = re.sub(r"\s+(?:by|on|before|at)\s*$", "", cleaned_action, flags=re.IGNORECASE).strip()
            confidence += 0.05

        # Normalize action casing: capitalize first letter
        cleaned_action = cleaned_action.strip().rstrip(".,;")
        if not cleaned_action or len(cleaned_action) < 3:
            return None

        # Ensure the action contains at least one commitment or task verb
        action_tokens = [w.lower() for w in re.findall(r"\b\w+\b", cleaned_action)]
        if not any(token in self.COMMITMENT_VERBS for token in action_tokens):
            return None

        cleaned_action = cleaned_action[0].upper() + cleaned_action[1:]

        # Cap confidence between 0.0 and 0.98 (no claim of perfect NLP)
        confidence = min(0.98, max(0.60, round(confidence, 2)))

        # Create stable ID derived from content and position
        hash_input = f"{owner}:{cleaned_action}:{deadline_str}:{start_char}"
        short_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()[:8]
        stable_id = f"cmt-{short_hash}"

        # Build evidence
        evidence_id = source_id or f"ev-transcript-{short_hash}"
        evidence = CommitmentEvidence(
            evidence_ref=evidence_id,
            raw_quote=clause_text.strip(),
            start_char=start_char,
            end_char=end_char,
            speaker=owner,
        )

        return Commitment(
            id=stable_id,
            owner=owner,
            action=cleaned_action,
            deadline=deadline_str,
            source=source,
            status=CommitmentStatus.PENDING,
            confidence=confidence,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            evidence_ref=evidence_id,
            evidence=evidence,
            metadata={
                "raw_clause": clause_text,
                "normalized_action": cleaned_action,
                "has_explicit_deadline": deadline_str is not None,
            }
        )
