# NIA — BHUPATHI MASTER IMPLEMENTATION PROMPTS (IN-DEPTH)
## Isolated 40% Module — VoiceMemo Pro + Commitment Intelligence

> **Mission:** Build a clean, independently testable Commitment Intelligence module that can be merged into Sanjay's NIA core with minimal conflict.
>
> **You do NOT rebuild NIA.** Sanjay owns the shared architecture, NIA Orb, wake-up orchestration, VEYRA X, Reality Graph, Evidence Replay, Impact Graph, Safe Action Gate, global navigation/theme, backend bootstrap, deployment and final integration.
>
> **Your responsibility:** transcript → structured commitments → persistence/API → isolated VoiceMemo UI → Reality Graph adapter → follow-up proposals → tests → documentation.
>
> **Platform rule:** local AI belongs on the phone. Render must not load multi-GB models. Deterministic extraction is the guaranteed fallback.
>
> **Execution rule:** Give Gemini Antigravity exactly ONE prompt at a time. After each prompt it must stop, test, report changed files and wait.

---

# 0. OWNERSHIP CONTRACT

```text
You are Bhupathi, implementing the isolated Commitment Intelligence module for NIA.

You own:

Backend:
backend/app/modules/commitments/
- domain models
- schemas
- extractor
- repository
- service
- API route definitions
- module tests

Frontend:
frontend/src/features/commitments/
frontend/src/features/voiceMemo/
- isolated reusable components only
- no global navigation redesign
- no global theme redesign

Docs:
docs/COMMITMENT_MODULE.md

Tests:
module-specific tests under the existing test structure.

You must NOT modify unless Sanjay explicitly approves:
- root README
- global navigation
- global theme
- NIA Orb
- VEYRA X
- Reality Graph core
- Evidence Replay
- Impact Graph
- Safe Action Gate
- backend main bootstrap
- global API client
- shared contracts
- Render deployment
- Sanjay-owned files

If a shared contract is insufficient:
STOP and report:
1. missing field/type
2. why it is needed
3. proposed compatibility adapter
4. files that would be affected

Do not directly edit the shared contract just because it is convenient.

Success means:
isolated
typed
testable
documented
easy to merge
connected to Reality Graph through an adapter
```

---

# 1. CLONE + SAFE BRANCH SETUP

```text
Clone the NIA repository.

Before editing:
git status
git branch
git remote -v
git log --oneline -10

Read:
README.md
docs/PROJECT_OVERVIEW.md
docs/ARCHITECTURE.md
docs/DEVELOPMENT_RULES.md
docs/MODULE_OWNERSHIP.md
docs/API_CONTRACT.md

Create:
git checkout -b feature/bhupathi-commitment-intelligence

Never work on main.

Inspect:
- repository tree
- existing frontend structure
- existing backend module structure
- shared contracts
- existing test commands
- package manager
- Python environment
- existing API conventions

Print:
1. current branch
2. owned folders
3. forbidden folders
4. shared interfaces you will consume
5. commands for tests/lint/type checks
6. any contract ambiguity

Do not implement product features yet.
```

Verification: branch is not main.

Commit only if a setup note is actually needed:
`chore: prepare commitment module branch`

---

# 2. DESIGN THE COMMITMENT DOMAIN BEFORE CODING

```text
Design the Commitment Intelligence domain.

Purpose:
NIA should convert statements from conversations/meetings into structured commitments.

Example:
“I will submit the presentation slides by Friday.”

Expected:
owner = current user
action = Submit the presentation slides
deadline = Friday
source = conversation
status = PENDING

Example:
“Sanjay will submit the slides by Friday.”

Expected:
owner = Sanjay
action = Submit the slides
deadline = Friday
source = meeting transcript
status = PENDING

Required fields:
id
owner
action
deadline
source
status
created_at
updated_at
related_event_id
related_location
confidence
evidence_ref

Statuses:
PENDING
IN_PROGRESS
COMPLETED
CANCELLED
AT_RISK

Important:
This is NOT a generic task manager.

A commitment has provenance and context.
It must be able to connect to:
- meeting/conversation evidence
- event
- location
- person
- Reality Graph entity

Define source types:
CONVERSATION
MEETING_TRANSCRIPT
VOICE_MEMO
IMPORTED_TEXT
DEMO

Define confidence carefully:
confidence represents extraction confidence, not truth of the commitment itself.

Define deadline representation so relative phrases can be normalized without inventing dates.

Document ambiguity handling:
- missing deadline
- unknown owner
- unclear action
- conflicting speaker attribution
- low-confidence extraction

Create docs/COMMITMENT_MODULE.md before implementation.
```

Verification: schema/domain review before implementation.

Commit: `docs: define commitment intelligence module`

---

# 3. BACKEND PYDANTIC SCHEMAS

```text
Implement only schemas inside the commitment module.

Create:
CommitmentStatus enum
CommitmentSource enum
Commitment
CommitmentEvidence
CommitmentExtractionRequest
CommitmentExtractionResponse
CommitmentUpdate
CommitmentLinkRequest
FollowUpProposal

Required Commitment:
id
owner
action
deadline
source
status
confidence
created_at
updated_at
related_event_id
related_location
evidence_ref

Use nullable fields where real-world input may be missing.

Validation:
- action cannot be empty
- confidence between 0 and 1
- status must be enum
- timestamps must be valid
- IDs must be stable
- deadline must not be fabricated

Compatibility:
consume Sanjay's shared contract where appropriate.
Do not create a competing global Commitment model.

If import causes circular dependency:
use a boundary adapter or module-local representation that serializes exactly to the shared contract.

Do not implement extraction.
Do not implement database.
Do not implement API routes yet.
```

Verification: import/type/serialization tests.

Commit: `feat: add commitment domain schemas`

---

# 4. DETERMINISTIC COMMITMENT EXTRACTION

```text
Implement CommitmentExtractor.

Input:
plain transcript text
optional source metadata
optional current date/time context
optional known participant names

Output:
zero or more structured commitments
plus extraction metadata/confidence.

Start rule-based.
Do not require an LLM.

Recognize patterns such as:
“I will …”
“I’ll …”
“I can …”
“[Name] will …”
“[Name] is going to …”
“by Friday”
“by Monday”
“tomorrow”
“next week”
“at 5 PM”
“before Friday”
“submit”
“send”
“finish”
“prepare”
“present”
“review”
“complete”

Extraction steps:
1. normalize transcript
2. split into candidate statements
3. identify commitment verb/intent
4. identify owner
5. identify action
6. identify deadline expression
7. identify source
8. calculate extraction confidence
9. emit structured commitment
10. attach evidence reference/quote location when available

Do NOT:
- invent owners
- invent deadlines
- convert vague statements into precise dates without sufficient context
- treat “we should…” automatically as a commitment
- treat questions as commitments
- treat past-tense statements as future commitments
- claim perfect NLP

Examples that should NOT necessarily become commitments:
“Did you submit the slides?”
“We should probably finish this.”
“Can you send it?”
“The slides were submitted yesterday.”

Multiple commitments:
“I’ll submit the slides Friday and send the report Monday.”
→ two commitments if confidently separable.

Return confidence and reason/metadata.

Create positive and negative unit tests.
```

Commit: `feat: implement commitment extraction`

---

# 5. COMMITMENT REPOSITORY + STORAGE

```text
Implement a repository interface and lightweight prototype implementation.

Operations:
create
get
list
update
update_status
delete
link_to_event
link_to_location
mark_at_risk

Do not create a second database system.

Use the project's existing repository/storage strategy.
If the project currently uses an in-memory/local repository, integrate with it.
If persistent storage exists, use the same infrastructure.

Repository must not depend on FastAPI route objects.

Rules:
- stable IDs
- timestamps
- deterministic ordering
- no duplicate accidental creation
- safe not-found errors
- partial update support
- status transition validation where appropriate

Status transition examples:
PENDING → IN_PROGRESS
PENDING → COMPLETED
PENDING → CANCELLED
PENDING → AT_RISK
IN_PROGRESS → COMPLETED
IN_PROGRESS → AT_RISK

Do not automatically change status just because a deadline is near unless explicitly implemented and documented.

Test all CRUD and error paths.
```

Commit: `feat: add commitment repository`

---

# 6. COMMITMENT API

```text
Implement isolated FastAPI routes using the project's existing API versioning.

Required operations:
POST /commitments/extract
POST /commitments
GET /commitments
GET /commitments/{id}
PATCH /commitments/{id}
PATCH /commitments/{id}/status
PATCH /commitments/{id}/link
DELETE /commitments/{id}

Follow existing API naming conventions if they differ.

Extract endpoint:
input transcript + source/context
output extraction response

Create endpoint:
accept validated Commitment

List:
filter by owner/status/event/location where supported

Link:
event ID and/or location

Status:
validate enum and transition

Errors:
structured
no stack traces
no internal paths
clear 4xx/5xx distinction

Do not modify backend main bootstrap unnecessarily.

If route registration requires a shared file change:
make the smallest possible change and tell Sanjay exactly what changed.

Do not create duplicate routers or a second API versioning system.
```

Commit: `feat: add commitment API`

---

# 7. ISOLATED VOICEMEMO FRONTEND

```text
Build an isolated VoiceMemo feature.

Location:
frontend/src/features/voiceMemo/

The feature should support:
- idle
- recording
- stopped
- transcript preview
- processing
- extracted commitments
- save
- error

UI:
Record button
Stop button
duration
transcript
processing indicator
commitment extraction result
confidence
Save commitment
Discard

Do not create global navigation.
Export reusable components/hooks.

Possible components:
VoiceMemoRecorder
RecordingIndicator
TranscriptPreview
CommitmentExtractionPreview
VoiceMemoErrorState

Architecture:
Recording adapter
→ transcript provider
→ commitment extraction API/provider
→ commitment result

Expo Go:
use supported Expo-compatible recording APIs where available.
If native capability is unavailable, provide a clear adapter/demo transcript path.

Never fake a recording that did not occur in a real-user path.
Demo mode may use a deterministic fixture, clearly controlled by debug/demo configuration.

Do not modify global theme.
Consume existing NIA design tokens.
```

Commit: `feat: add isolated VoiceMemo UI`

---

# 8. COMMITMENT UI COMPONENTS

```text
Build reusable commitment components.

Location:
frontend/src/features/commitments/

Components:
CommitmentCard
CommitmentList
CommitmentDetail
CommitmentStatusBadge
CommitmentEmptyState
CommitmentConfidence
CommitmentSourceBadge

Display:
Owner
Action
Deadline
Status
Source
Confidence
Related event
Related location

Interaction:
open detail
change status
link context where supported
mark completed
review evidence

Do not create a generic productivity dashboard.
This must feel like part of NIA.

Visual language:
dark premium surface
subtle status indication
clear hierarchy
minimal clutter
large touch targets

Status should be understandable without relying only on color.
Use labels/icons where useful.

Loading/error/empty states are required.

Do not modify:
NIA Orb
global navigation
global theme
shared contract

Export components/hooks cleanly for Sanjay's integration.
```

Commit: `feat: add commitment UI components`

---

# 9. COMMITMENT ↔ REALITY GRAPH ADAPTER

```text
Create an isolated integration adapter.

Do NOT modify VEYRA X.

Expose:
getCommitmentsForEntity(entityId)
getCommitmentsForEvent(eventId)
getCommitmentsForLocation(location)
linkCommitmentToEvent(commitmentId, eventId)
linkCommitmentToLocation(commitmentId, location)
markAtRisk(commitmentId, reason)

Example:
Commitment:
“Sanjay will submit presentation slides by Friday.”

Related event:
Final Presentation

Related location:
Room 204

When VEYRA detects:
Room 204 → Room 302

The core can ask:
Which commitments relate to this event/location?

Your module returns structured commitments.
Your module does NOT decide whether reality drift exists.

Boundary responsibility:
Bhupathi = commitment intelligence.
Sanjay/VEYRA = reality verification and impact reasoning.

Do not introduce graph database dependencies.

Test:
event lookup
location lookup
linking
missing entity
multiple commitments
at-risk reason preservation
```

Commit: `feat: connect commitments to reality entities`

---

# 10. FOLLOW-UP PROPOSALS

```text
Implement a proposal-only follow-up service.

Input:
commitment
current state/time
optional impact context

Output:
FollowUpProposal:
proposal_id
commitment_id
message
reason
created_at
requires_approval = true

Examples:
“You have a pending commitment to submit the presentation slides by Friday.”

“Your presentation location changed. The related commitment may be affected.”

Rules:
- propose only
- never automatically send
- never open WhatsApp/SMS/email without explicit later integration
- no unrestricted app control
- no fabricated delivery confirmation

Make messages concise and factual.

If deadline is missing:
do not invent one.

If commitment is cancelled/completed:
do not create a normal overdue reminder proposal.

Test proposal generation for:
pending
completed
cancelled
at-risk
missing deadline
changed location
```

Commit: `feat: add commitment follow-up proposals`

---

# 11. OPTIONAL LOCAL-LLM EXTRACTOR

```text
Add an optional provider interface.

CommitmentExtractorProvider
- RuleBasedCommitmentExtractor
- LocalLLMCommitmentExtractor

Rules:
- deterministic extractor is always available
- local LLM runs on the phone when used
- Render must not load the model
- no model weights in Git
- LLM output must be validated against Pydantic schema
- malformed output falls back to rules
- uncertain output gets lower confidence
- never invent deadlines/owners

The provider must return the same domain contract as the rule-based implementation.

Do not make the UI care which provider produced the result.

Add a provider selection policy:
local model available → optional local provider
otherwise → rule-based

Do not add a large model merely to demonstrate “AI”.
The feature must remain functional without one.
```

Commit: `feat: add optional local commitment extractor`

---

# 12. COMPLETE MODULE TEST SUITE

```text
Create module-level tests.

Extraction:
- simple first-person commitment
- named owner
- multiple commitments
- relative deadline
- explicit time
- missing deadline
- vague statement
- question
- past statement
- low-confidence text
- no commitment
- owner ambiguity
- deadline ambiguity

Repository:
- create
- get
- list
- update
- delete
- status
- event link
- location link
- at-risk

API:
- valid request
- invalid request
- not found
- malformed payload
- structured errors

Integration adapter:
- event lookup
- location lookup
- multiple commitments
- missing relationship

Follow-up:
- pending
- completed
- cancelled
- at-risk
- changed location

Local LLM:
- unavailable
- valid output
- malformed output
- schema violation
- fallback

Frontend:
- recorder states
- extraction display
- commitment card
- empty state
- error state

Do not modify unrelated test suites.
```

Commit: `test: add commitment intelligence coverage`

---

# 13. MODULE DOCUMENTATION

```text
Update ONLY:
docs/COMMITMENT_MODULE.md

Document:
1. purpose
2. ownership
3. directory structure
4. domain model
5. status values
6. extraction rules
7. confidence semantics
8. evidence/provenance
9. repository
10. API
11. frontend components
12. Reality Graph adapter
13. follow-up proposals
14. local LLM option
15. fallback behavior
16. tests
17. limitations
18. integration instructions for Sanjay

State clearly:
“Commitment Intelligence extracts and tracks commitments. VEYRA X owns reality verification.”

Also document:
- no automatic external messages
- no model weights in repository
- local model is optional
- Render remains lightweight
- Expo Go recording limitations if applicable
```

Commit: `docs: document commitment intelligence module`

---

# 14. PREPARE MERGE PACKAGE

```text
Prepare the branch for Sanjay.

Run:
git status
git diff main...HEAD

Run:
frontend tests
backend tests
module tests
lint/type checks
API smoke tests

Inspect changed files.

Verify:
- no global navigation changes
- no global theme changes
- no Orb changes
- no VEYRA changes
- no Reality Graph core changes
- no Evidence Replay changes
- no Impact Graph core changes
- no Safe Action Gate changes
- no Render config changes
- no secrets
- no model weights
- no generated junk
- no duplicate schemas
- no unnecessary dependencies

If a shared-file change is unavoidable:
do not silently keep it.
Document:
file
reason
exact change
integration risk

Update COMMITMENT_MODULE.md with merge instructions.

Do not merge main into your branch unless Sanjay asks.
```

Commit if needed:
`chore: prepare commitment module for integration`

---

# 15. FINAL GIT PUSH

```text
Only after tests and diff inspection:

git status
git add backend/app/modules/commitments frontend/src/features/commitments frontend/src/features/voiceMemo docs/COMMITMENT_MODULE.md tests
git commit -m "feat: add commitment intelligence module"
git push -u origin feature/bhupathi-commitment-intelligence

Never push directly to main.
Never force push.

Send Sanjay this integration report:

Commitment Intelligence module is ready.

Branch:
feature/bhupathi-commitment-intelligence

Owned areas changed:
[list actual files]

Tests:
[actual result]

API:
[list actual routes]

Integration adapter:
[list actual interfaces]

Shared-file changes:
[none OR exact list]

Known limitations:
[actual limitations]

Documentation:
docs/COMMITMENT_MODULE.md
```

---

# 16. GIT CONFLICT / SHARED FILE SAFETY

```text
If a conflict occurs, stop and inspect.

Run:
git status
git diff

If conflict is in:
- NIA Orb
- VEYRA
- Reality Graph core
- global navigation
- global theme
- backend bootstrap
- shared contract
- Render config

STOP.
Show Sanjay the conflict.
Do not choose ours/theirs blindly.

If conflict is inside your own commitment module:
resolve while preserving intended behavior, then run tests.

If a merge/rebase is in progress and you are unsure:
git status

Do NOT run:
git reset --hard
git clean -fd
force push
history rewriting

unless Sanjay explicitly instructs you.

The goal is integration, not winning a Git conflict.
```

---

# 17. FINAL SUCCESS CRITERIA

```text
Your work is complete only if:

[ ] isolated module
[ ] clean branch
[ ] no unnecessary shared-file edits
[ ] typed schemas
[ ] deterministic extraction
[ ] confidence included
[ ] evidence/provenance included
[ ] repository works
[ ] API works
[ ] VoiceMemo UI works
[ ] commitment UI works
[ ] Reality Graph adapter works
[ ] follow-up proposals work
[ ] local LLM is optional
[ ] rule-based fallback always works
[ ] no model weights in Git
[ ] no Render model dependency
[ ] no automatic external messaging
[ ] tests pass
[ ] docs complete
[ ] clean diff
[ ] ready for Sanjay PR review

Do not measure success by number of files changed.
Measure success by:
correctness + isolation + testability + clean integration.
```

## FINAL RULE FOR GEMINI ANTIGRAVITY

**One prompt = one milestone.**

After every prompt:
1. inspect
2. implement only requested scope
3. run relevant tests
4. fix related failures
5. show changed files
6. show test results
7. show limitations
8. stop and wait for the next prompt
