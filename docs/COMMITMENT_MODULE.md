# NIA Commitment Intelligence Module Specification
> **Document Status:** Authoritative Domain Specification  
> **Module Owner:** Bhupathi (40% Isolated Module)  
> **Core Architecture Owner:** Sanjay (60% Platform & Reality Engine)  

---

## 1. Executive Summary & Purpose

The **Commitment Intelligence** module transforms unstructured spoken utterances, voice memos, and meeting transcripts into structured, actionable, and provenance-backed commitments.

### Key Tenet: Not a Generic To-Do List
A standard task manager tracks isolated string descriptions created manually by a user. In contrast, an **NIA Commitment** represents an interpersonal or personal promise made in reality:
- **Provenance:** Every commitment is anchored to specific conversational or auditory evidence (`evidence_ref`).
- **Contextual Grounding:** Commitments can link to physical locations, calendar events, counterparties/owners, and Reality Graph entities.
- **Drift Awareness:** When physical or digital reality diverges from a commitment (e.g., meeting room changes or schedule conflicts), the commitment can be evaluated by VEYRA X for Reality Drift.

### Local AI & Render Constraint
- Heavy neural networks belong on the client/phone device (e.g., on-device whisper/speech-to-text or small SLMs).
- The Render backend strictly runs deterministic rule-based/regex extraction as the primary zero-dependency fallback, ensuring high reliability with zero heavy model weights.

---

## 2. Domain Model Specification

### 2.1 Entity: `Commitment`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `str` | Yes | Unique stable identifier (e.g., `cmt-c7f8a9e1`) |
| `owner` | `str` | Yes | Person responsible for fulfilling the commitment (e.g., `"current_user"`, `"Sanjay"`) |
| `action` | `str` | Yes | The concrete promise or action to be completed |
| `deadline` | `Optional[str]` | No | Normalized deadline representation or relative expression (e.g., `"Friday"`, `"2026-09-25T17:00:00Z"`) |
| `source` | `CommitmentSource` | Yes | Origin context of the commitment |
| `status` | `CommitmentStatus` | Yes | Current lifecycle state |
| `confidence` | `float` | Yes | Confidence score `[0.0, 1.0]` of the extraction process |
| `created_at` | `datetime` | Yes | UTC timestamp when the commitment was extracted |
| `updated_at` | `datetime` | Yes | UTC timestamp of last status or data update |
| `related_event_id` | `Optional[str]` | No | Foreign key linking to calendar or digital state event |
| `related_location` | `Optional[str]` | No | Physical location associated with the action |
| `evidence_ref` | `Optional[str]` | No | URI or ID referencing the source transcript / audio memo |

### 2.2 Lifecycle Statuses (`CommitmentStatus`)
- **`PENDING`**: Extracted commitment awaiting fulfillment or scheduled deadline.
- **`IN_PROGRESS`**: Actively being worked on or partially fulfilled.
- **`COMPLETED`**: Successfully fulfilled and verified.
- **`CANCELLED`**: Explicitly called off, superseded, or voided.
- **`AT_RISK`**: Approaching deadline with unresolved blockers or Reality Drift detected.

### 2.3 Source Types (`CommitmentSource`)
- **`CONVERSATION`**: Multi-speaker live dialogue captured via voice shell.
- **`MEETING_TRANSCRIPT`**: Structured meeting minutes or multi-speaker transcript.
- **`VOICE_MEMO`**: Dictated personal voice note or audio memo.
- **`IMPORTED_TEXT`**: Text imported from messages, email, or external documents.
- **`DEMO`**: Deterministic synthetic scenario for demonstration and testing.

---

## 3. Extraction Semantics & Confidence

### 3.1 Understanding `confidence`
> [!IMPORTANT]
> `confidence` measures the **extraction reliability** (syntactic clarity, linguistic certainty, and speaker attribution confidence), **NOT** the objective moral truth or likelihood of the person following through.

- **High Confidence (`>= 0.85`)**: Explicit first/third-person modal commitment with unambiguous verb and explicit or clearly inferable deadline (e.g., *"I will email the financial deck to Priya by tomorrow 5 PM"*).
- **Medium Confidence (`0.60 - 0.84`)**: Clear commitment verb but ambiguous relative time or implicit owner (e.g., *"We should review the draft next week"*).
- **Low Confidence (`< 0.60`)**: Conditional, speculative, or ambiguous intent requiring human verification before activation (e.g., *"Maybe I can look into that bug later"*).

### 3.2 Deadline Representation: No Invented Dates
Real conversations frequently use relative temporal references:
- *"by Friday"*
- *"before the sprint review"*
- *"next week"*
- *"in an hour"*

**Normalization Rule:**
1. If reference timestamp $T_{ref}$ is provided and the relative expression maps cleanly to a calendar date, the deadline stores a normalized representation (e.g., `iso_deadline = "2026-09-25T17:00:00Z"` alongside `raw_deadline = "Friday"`).
2. If the expression is relative and cannot be resolved without guessing (e.g., *"by next time"* or *"soon"*), store the literal string in `raw_deadline` and set `iso_deadline = null`.
3. **Never fabricate concrete calendar timestamps** when the source text lacks adequate anchoring.

---

## 4. Ambiguity & Real-World Edge Cases

| Scenario | Behavior / Extraction Rule |
| :--- | :--- |
| **Missing Deadline** | Extracted with `deadline = null`. The commitment remains `PENDING` with an indicator that it has an open horizon. |
| **Unknown Owner** | If speaker attribution is missing, default `owner = "current_user"` if in single-user VoiceMemo mode, or `owner = "UNKNOWN"` with lower confidence if in multi-speaker meeting mode. |
| **Unclear Action** | If verb phrase cannot be parsed or lacks an object (e.g., *"I will do it"* without referent), mark confidence as low (`< 0.50`) and flag `needs_clarification = true`. |
| **Conflicting Speaker Attribution** | When speaker diarization is ambiguous between Speaker A and Speaker B, preserve candidate owners in metadata and request confirmation. |
| **Low-Confidence Extraction** | Retain in repository under a `PROVISIONAL` or low-confidence filter so it does not trigger automatic calendar sync without explicit user review. |

---

## 5. Reality Graph Adapter & Core Integration

Sanjay owns the Reality Graph, Impact Engine, and the core shared contracts. To prevent breaking changes:

### 5.1 Shared Contract Comparison & Adapter
* Core contract in `backend/app/schemas/commitment.py`:
  - Fields: `commitment_id`, `title`, `counterparty`, `deadline`, `confidence`, `status`, `evidence_ref`, `created_at`, `metadata`.
* Bhupathi domain model:
  - Fields: `id`, `owner`, `action`, `deadline`, `source`, `status`, `confidence`, `created_at`, `updated_at`, `related_event_id`, `related_location`, `evidence_ref`.

### 5.2 Compatibility Adapter Specification
To maintain strict isolation, Bhupathi provides:
1. `to_core_commitment(self) -> app.schemas.commitment.Commitment`:
   - Maps `id` $\to$ `commitment_id`
   - Maps `action` $\to$ `title`
   - Maps `owner` $\to$ `counterparty` (or stores in `metadata["owner"]`)
   - Translates `CommitmentStatus` enum safely to `app.schemas.enums.CommitmentStatus`
   - Preserves `evidence_ref`, `created_at`, `deadline`, `confidence`
   - Encapsulates `source`, `related_event_id`, `related_location` in `metadata`
2. `to_reality_graph_node(self) -> Dict[str, Any]`:
   - Exposes node for Reality Graph traversal with type `"COMMITMENT"`.

---

## 6. Architecture & File Ownership

### 6.1 Backend (`backend/app/modules/commitments/`)
- `models.py`: Internal domain models and in-memory/DB representation.
- `schemas.py`: Pydantic v2 schemas (`Commitment`, `CommitmentExtractionRequest`, `CommitmentExtractionResponse`, etc.).
- `extractor.py`: Deterministic rule-based commitment extraction engine.
- `repository.py`: In-memory persistence and query interface.
- `service.py`: Business logic, filtering, follow-up generation, and core adapter.
- `router.py`: REST API endpoints for `/api/v1/commitments`.

### 6.2 Frontend (`frontend/src/features/`)
- `commitments/`: Isolated React Native components (Commitment Card, Status Badge, Commitment List).
- `voiceMemo/`: Audio capture simulation, waveform preview, transcript parser, and one-tap commitment extraction.

### 6.3 Test Strategy (`tests/backend/test_commitments.py`)
- Extraction accuracy across standard patterns:
  - *"I will [action] by [deadline]"*
  - *"[Name] will [action] on [date]"*
  - Complex meeting dialogue with mixed filler text
- Status transition invariants
- Adapter compatibility with Sanjay's core schemas
- Edge case handling (empty strings, missing deadlines, ambiguous owners)
