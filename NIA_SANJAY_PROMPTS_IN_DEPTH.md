# NIA — SANJAY MASTER IMPLEMENTATION PROMPTS (IN-DEPTH)
## Natural Intelligence Assistant | React Native + Expo + FastAPI | iQOO phone-first prototype

> **Execution rule:** Give Gemini Antigravity exactly ONE prompt at a time. After each prompt it must stop, test, report changed files, and wait. Never ask it to implement the whole project in one pass.
>
> **Product source of truth:** NIA is a Reality-Verified Personal Intelligence Layer centered on **“Is what I know still true?”**. VEYRA X is the internal Reality Intelligence Engine: Perception → Truth/Drift → Evidence → Timeline → Impact → Action. The phone is the primary product. Mind Pulse, VoiceMemo/Commitment Intelligence, Evidence Replay, Safe Action Gate and Office Kit support this core.
>
> **Technology:** React Native + Expo frontend, FastAPI backend. Local AI belongs on the phone. Render must remain lightweight. Expo Go is the rapid UI/API surface; native-only Android capabilities must be behind adapters and tested in a development build/APK.
>
> **Ownership:** Sanjay owns the core architecture, shared UI, NIA Orb, wake-up orchestration, VEYRA X, Reality Graph, Evidence Replay, Impact Graph, Safe Action Gate, Mind Pulse orchestration, backend core, integration and final QA. Bhupathi owns the isolated VoiceMemo/Commitment Intelligence module.

---

# 0. NON-NEGOTIABLE PRODUCT CONTRACT

```text
Before touching code, inspect the repository and understand the NIA product contract.

NIA = Natural Intelligence Assistant.

Core question:
“Is what I know still true?”

NIA is NOT:
- a generic chatbot
- a CRUD dashboard
- an autonomous agent that changes user data silently
- a cloud-only AI service
- an app that pretends Expo Go supports Android system services

NIA IS:
- a phone-native AI assistant
- a reality-verification layer
- an evidence-first reasoning system
- a safe-action system requiring explicit approval

VEYRA X is an internal engine, not a second chatbot.

VEYRA X conceptual pipeline:
1. PERCEPTION — receive digital and physical observations.
2. NORMALIZATION — convert observations into comparable structured facts.
3. TRUTH — compare current observations with known digital state.
4. DRIFT — determine whether a meaningful contradiction exists.
5. EVIDENCE — preserve source, timestamp, confidence and extracted values.
6. TIMELINE — record what changed and when.
7. IMPACT — identify events/reminders/alarms/commitments affected.
8. ACTION — propose a safe action; never execute consequential changes without approval.

Four activation paths must converge into one WakeUpOrchestrator:
1. “Hey NIA” → voice activation.
2. NIA Orb tap/hold or circle interaction → verification/action.
3. 3-finger swipe up → Mind Pulse.
4. App icon → full NIA application.

The primary hackathon story is:
Digital calendar says Final Presentation at 09:00 in Room 204.
A physical notice says presentations moved to Room 302.
NIA captures/reads the evidence.
VEYRA X detects Reality Drift.
NIA explains the conflict.
Evidence Replay shows both sources.
Impact Graph shows affected reminder/alarm/commitment.
NIA proposes updating the reminder.
Safe Action Gate asks for approval.
Only after approval is the change executed.
Reality Timeline records the result.
Office Kit can export a Reality Audit.

Platform truth:
- Expo Go: UI, API, in-app gestures, supported camera/audio, simulation adapters.
- Android development build/APK: native wake word, system-wide Mind Pulse, AccessibilityService, MediaProjection, native ML Kit OCR, native local model runtime where needed.
- Never fake unsupported background services.
- Every native-only feature needs an honest fallback.

Local AI:
- Models run on the iQOO phone.
- Render never downloads or loads multi-GB weights.
- Deterministic VEYRA logic must work without an LLM.
- LLM is optional for language/explanation/extraction.
- Use lazy loading and sequential model use.
- Never commit model weights or secrets.

Safety:
- UI cannot directly mutate calendar/reminder state.
- Every consequential action goes through Safe Action Gate.
- Store before/after state and evidence references.
- Demo fixtures must be deterministic and clearly distinguishable in developer/debug configuration.

Scope:
Do not expand into full AR, broad sensor fusion, future drift prediction, unrestricted autonomous control, huge multimodal models, or full multilingual speech-to-speech unless explicitly requested later.

At the end of this inspection, print:
- product invariants
- four activation paths
- VEYRA pipeline
- platform limitations
- local-AI/Render boundary
- ownership boundaries
- what you will NOT build in this prompt

Do not code yet.
```

**Done when:** Antigravity demonstrates understanding without modifying product behavior.

---

# 1. REPOSITORY FOUNDATION + DEVELOPMENT RULES

```text
Build the NIA repository foundation only.

Target structure:

NIA/
  frontend/
    src/
      components/
      features/
      navigation/
      state/
      services/
      adapters/
      contracts/
      config/
      theme/
  backend/
    app/
      api/
      core/
      schemas/
      services/
      repositories/
      modules/
        reality/
        evidence/
        actions/
        digital_state/
        physical_observation/
        commitments/       # reserved for Bhupathi
  docs/
  tests/
  scripts/
  README.md
  .gitignore

Use:
- React Native + Expo-compatible architecture
- FastAPI
- typed frontend contracts
- Pydantic backend schemas
- repository/service separation
- adapter boundaries for native capabilities
- environment-driven configuration

Create:
README.md
docs/PROJECT_OVERVIEW.md
docs/ARCHITECTURE.md
docs/DEVELOPMENT_RULES.md
docs/ENVIRONMENT.md
docs/MODULE_OWNERSHIP.md
docs/API_CONTRACT.md
docs/LOCAL_AI_AND_RENDER.md

Document:
- phone-first architecture
- request/response flow
- frontend/backend boundary
- adapter strategy
- Expo Go vs development-build behavior
- Render limitations
- local AI ownership
- Git ownership

Ownership:
Sanjay:
core architecture, shared UI, Orb, wake-up, VEYRA X, Reality Graph,
Evidence Replay, Impact Graph, Safe Action Gate, Mind Pulse orchestration,
backend core, integration, QA.

Bhupathi:
commitment extraction, VoiceMemo, commitment repository/API/UI/tests/docs.

Do NOT implement product features yet.
Do NOT add unnecessary dependencies.
Do NOT add model files.
Do NOT add secrets.
Do NOT modify Bhupathi's module.
```

**Verification:** run install/type/lint/test checks; show exact tree; show ownership boundaries.

Commit: `chore: initialize NIA repository architecture`

---

# 2. SHARED CONTRACTS — SINGLE SOURCE OF TRUTH

```text
Implement ONLY shared domain contracts.

Create strongly typed contracts for:
- NIAResponse
- Intent
- IntentSource
- EvidenceItem
- DigitalObservation
- PhysicalObservation
- RealityState
- DriftResult
- ImpactItem
- ProposedAction
- ApprovalState
- Commitment
- TimelineEvent
- AgentState
- WakeUpEvent
- Session

Every reality result must explain:
- entity
- digital known value
- physical observed value
- whether they agree
- drift type
- confidence
- evidence references
- timestamps
- affected entities
- proposed action
- approval requirement

Define stable enums instead of arbitrary strings where appropriate.

Example Reality result:

{
  entity: "Final Presentation",
  digital: { location: "Room 204", source: "calendar" },
  physical: { location: "Room 302", source: "ocr" },
  state: "REALITY_DRIFT",
  driftType: "LOCATION_CHANGED",
  confidence: 0.94,
  evidenceRefs: ["ev-calendar-1", "ev-ocr-1"],
  impactRefs: ["reminder-1", "alarm-1"],
  proposedActionRef: "action-1",
  approvalRequired: true
}

Create versioned API contracts.

Frontend and backend must serialize the same meaning.
Avoid duplicate definitions.
If TypeScript and Pydantic cannot share generated types yet, keep names/fields exactly aligned and document the source of truth.

Create docs/API_CONTRACT.md with example request/response JSON for:
- reality check
- evidence
- impact
- action proposal
- action approval
- timeline
- wake-up
- commitment integration

Do not implement business logic.
Do not implement database persistence.
Do not implement UI behavior.
```

**Verification:** serialization/deserialization tests and invalid-payload tests.

Commit: `feat: add shared NIA domain contracts`

---

# 3. PREMIUM NIA DESIGN SYSTEM + AGENT SHELL

```text
Build the visual shell only.

The first screen must immediately feel like:
“an AI intelligence layer living on the phone.”

Do NOT use a normal chatbot bubble layout.

Visual direction:
- dark cinematic base
- deep blue/purple/cyan atmosphere
- restrained glow
- large NIA Orb
- radar/energy/pulse motion
- minimal text
- large touch targets
- strong visual hierarchy
- premium spacing
- smooth transitions
- accessible labels
- responsive to different phone sizes

Create:
- AppShell
- Home/AgentScreen
- NIAOrb
- AgentStateIndicator
- VoiceButton
- TextInput
- QuickActions
- EvidencePreviewCard
- TimelinePreview
- SettingsEntry
- bottom/secondary navigation only if genuinely useful

Central state machine:
IDLE
LISTENING
THINKING
VERIFYING
DRIFT
VERIFIED
SPEAKING
ACTION_PENDING
SUCCESS
ERROR

Do not allow individual components to invent incompatible states.

Orb behavior:
IDLE = calm
LISTENING = active pulse
THINKING = rotating/radar motion
VERIFYING = scan/pulse
DRIFT = clear warning visual
VERIFIED = stable confirmation
ACTION_PENDING = focused attention
SUCCESS = brief completion animation
ERROR = recoverable error state

Performance:
- no expensive continuous particle systems
- pause animation when screen is inactive
- use native/optimized animation mechanisms available in Expo
- avoid huge images
- avoid unnecessary global re-renders

Create a small design-token layer:
spacing, radii, typography, opacity, motion duration, surface hierarchy.

Do not implement:
- wake word
- OCR
- calendar
- real AI
- native AccessibilityService
- LLM
```

**Verification:** run in Expo Go on a real phone; test rotation/small screens/accessibility labels.

Commit: `feat: create NIA agent shell and orb design system`

---

# 4. CONFIG + EXPO GO / LAN / RENDER TARGETING

```text
Implement robust backend targeting.

Required behavior:
ACTIVE_BACKEND = render | lan
LAPTOP_WIFI_IP configurable
API_PORT = 8000
RENDER_API_URL configurable
LOCAL/DEVICE URL support
EXPO_PUBLIC_API_BASE_URL has highest priority

Precedence:
1. explicit runtime/custom URL
2. EXPO_PUBLIC_API_BASE_URL
3. selected backend target
4. safe development default

Normalize:
- remove trailing slash
- accept http/https
- reject malformed URLs
- never silently convert secure URLs to insecure ones

Provide:
API_BASE_URL
resolveApiBaseUrl()
normalizeBackendUrl()
getBackendTarget()
setCustomBackendUrl()
clearCustomBackendUrl()

Persist user-selected target only if appropriate for development/demo.
Do not persist secrets.

Example:
LAN:
http://<LAPTOP_WIFI_IP>:8000

Render:
https://<your-nia-render-service>

Do not reuse old NiyamNetra naming except where compatibility is necessary.

Document:
- phone + Expo Go + Render
- phone + Expo Go + laptop LAN
- development build + LAN
- production/standalone + Render
- Android network permission implications
- how to find laptop IPv4
- common connection failures
- environment variable precedence

Create a test endpoint integration from the frontend.
```

**Verification:** switch Render/LAN and show the exact resolved URL without hardcoding.

Commit: `feat: add NIA backend target configuration`

---

# 5. FASTAPI BACKEND FOUNDATION

```text
Implement only the lightweight backend foundation.

Structure:
backend/app/
  main.py
  core/
    config.py
    logging.py
    errors.py
    request_context.py
  api/
    router.py
    health.py
  schemas/
  services/
  repositories/
  modules/
    reality/
    evidence/
    actions/
    digital_state/
    physical_observation/
    commitments/  # reserved

Implement:
GET /health
GET /ready
API version prefix such as /api/v1

Add:
- CORS for Expo development
- request/correlation ID
- structured error format
- safe exception handling
- environment config
- startup/shutdown hooks
- logging
- OpenAPI documentation
- lightweight readiness checks

Health must NOT mean “AI model loaded”.
Readiness must only check lightweight backend dependencies.

Critical Render rule:
- no LLM/STT/OCR model loading
- no model download during startup
- no multi-GB files
- no expensive initialization
- no background process pretending to be a model server

Keep storage replaceable:
repository interfaces first; SQLite/local prototype implementation where useful; allow later Supabase without rewriting domain logic.

Do not implement commitment logic.
Do not implement VEYRA business logic yet.
```

**Verification:** start locally, hit health/ready, run tests, confirm startup memory does not depend on model weights.

Commit: `feat: initialize FastAPI backend`

---

# 6. VEYRA X + REALITY GRAPH CORE

```text
Implement the deterministic Reality Intelligence Engine.

VEYRA X stages:

PERCEPTION:
accept DigitalObservation and PhysicalObservation.

NORMALIZATION:
canonicalize values such as:
Room 204, room 204, ROOM-204 → comparable representation.

TRUTH:
compare fields relevant to the same entity.

DRIFT:
identify meaningful changes:
LOCATION_CHANGED
TIME_CHANGED
DATE_CHANGED
STATUS_CHANGED
MISSING_DIGITAL_STATE
CONFLICT
LOW_CONFIDENCE_REQUIRES_REVIEW

EVIDENCE:
retain source, timestamp, confidence, raw/extracted value and reference.

TIMELINE:
record before/current state transitions.

IMPACT:
query related reminders, alarms, events and commitments through interfaces.

ACTION:
produce a proposed action only.

Reality Graph should represent entities and relationships:
event
location
reminder
alarm
commitment
person
evidence
timeline event
action

Do not create a giant graph database. A lightweight repository/domain graph is enough for the prototype.

Primary deterministic demo:
Digital:
Final Presentation
09:00
Room 204

Physical:
“Presentations moved to Room 302.”

Normalized observation:
location = Room 302

Result:
REALITY_DRIFT / LOCATION_CHANGED

Explanation:
“Calendar says Room 204, but the latest physical evidence says Room 302.”

Confidence must be traceable to observation quality, not invented by an LLM.

Rules:
- exact agreement → VERIFIED
- clear conflicting high-confidence observation → REALITY_DRIFT
- weak/ambiguous observation → NEEDS_REVIEW
- missing digital state → UNKNOWN/MISSING_DIGITAL_STATE
- never treat absence of evidence as proof of change

Implement deterministic tests for:
- no drift
- room drift
- time drift
- date drift
- low confidence
- missing digital state
- duplicate evidence
- stale evidence
- unrelated observations
- same room with different formatting
- multiple affected entities

No LLM for drift detection.
```

**Verification:** all deterministic tests pass and output is explainable.

Commit: `feat: implement VEYRA X reality drift engine`

---

# 7. EVIDENCE REPLAY + TIMELINE + IMPACT GRAPH

```text
Build evidence-first representations and UI.

Evidence Replay must answer:
1. What did NIA know?
2. What was observed?
3. When?
4. From where?
5. What changed?
6. Why was it considered a conflict?
7. What confidence exists?
8. What action was proposed?

Display:
Digital source → Room 204
Physical source → Room 302
timestamps
source badges
confidence
evidence references

Timeline:
Known state
↓
new observation
↓
drift detected
↓
impact calculated
↓
action proposed
↓
approval
↓
action result

Impact Graph:
Reality change
→ presentation event
→ reminder
→ alarm
→ commitment (if linked)

Make the graph understandable, not decorative.
Prefer a small relationship visualization or structured dependency chain over a complex graph library.

UI actions:
Why?
What changed?
What does this affect?
Review evidence
Fix it

Do not allow any action from this screen to bypass Safe Action Gate.

Handle:
- no evidence
- low confidence
- missing impact
- stale evidence
- duplicate timeline event
- rejected action

Keep raw evidence references immutable where possible.
```

**Verification:** complete Room 204 → Room 302 replay from one session.

Commit: `feat: add evidence replay timeline and impact views`

---

# 8. SAFE ACTION GATE

```text
Implement the action safety boundary.

NIA can:
PROPOSE → ASK → APPROVE/REJECT → EXECUTE → RECORD

NIA cannot:
silently change reminders
silently change calendar events
silently send messages
silently call external apps

ProposedAction:
action_id
type
description
affected_entity
before_state
proposed_state
evidence_refs
confidence
created_at
approval_state
execution_state

Approval states:
PENDING
APPROVED
REJECTED
EXPIRED

Execution states:
NOT_EXECUTED
EXECUTING
SUCCEEDED
FAILED

UI:
“Update reminder from Room 204 to Room 302?”

Buttons:
Approve
Reject
Review evidence

Approval must be explicit.
Do not treat opening a screen as approval.
Do not treat voice detection as approval unless the user explicitly says an approved command and the policy permits it; for the prototype keep button approval as the safest deterministic path.

Action service interface:
propose(action)
approve(action_id)
reject(action_id)
execute(action_id)
recordResult(action_id)

UI components must call the service, never mutate repositories directly.

For prototype, use a MockReminderRepository with the same interface a native Android reminder/calendar repository will use.

On success:
- store before/after
- append timeline event
- update graph
- show SUCCESS orb state
- make result replayable

On failure:
- do not claim success
- preserve failure reason
- allow retry/review
```

**Verification:** approve/reject/failure tests and UI cannot bypass gate.

Commit: `feat: implement safe action gate`

---

# 9. DIGITAL STATE / CALENDAR ADAPTER

```text
Create DigitalStateProvider and CalendarAdapter interfaces.

Required normalized event:
id
title
start
end
location
source
lastSyncedAt
metadata

Adapters:
LocalDemoCalendarAdapter
NativeCalendarAdapter
Optional remote/mock adapter only for testing

Expo Go:
use demo/local data or supported Expo APIs.

Native build:
isolate calendar permission and Android calendar integration.

Never claim access if permission is absent.

Permission flow:
explain why NIA needs calendar access
user chooses Allow/Not Now
only then request permission

Seed deterministic demo:
Final Presentation
09:00
Room 204

Create functions:
getUpcomingEvents()
getEventById()
refreshEvents()
normalizeEvent()

Digital state must be independent of UI.

Test:
- event found
- no event
- permission denied
- duplicate event
- timezone handling
- location missing
- stale sync
- changed event

Do not build calendar UI as a separate productivity app.
The adapter exists to feed Reality Intelligence.
```

Commit: `feat: add digital state calendar adapter`

---

# 10. PHYSICAL OBSERVATION + OCR PIPELINE

```text
Implement the physical evidence pipeline.

Architecture:
Camera/ScreenCapture
→ OCRProvider
→ Text/Entity Extraction
→ PhysicalObservation
→ VEYRA X

Create:
PhysicalObservationCapture
OCRProvider interface
DemoOCRProvider
DeviceOCRProvider/native adapter boundary
ObservationNormalizer
EvidenceBuilder

States:
IDLE
CAPTURING
PROCESSING
EXTRACTING
READY
ERROR

For notice:
“Presentations moved to Room 302.”

Expected:
rawText
location = Room 302
confidence
capture timestamp
source = camera/OCR

Privacy:
Default path:
image stays on device
OCR happens locally
only structured observation is sent to backend when required
raw image is not uploaded to Render by default

Expo Go:
use supported camera functionality and an explicit simulation adapter when native OCR is unavailable.

Development build:
provide native ML Kit OCR adapter boundary.

Do not pretend simulated OCR is real OCR.
Do not send raw images to Render unless an explicit feature later requires it.

Handle:
- blurry image
- no text
- multiple rooms
- ambiguous room number
- low confidence
- camera permission denied
- OCR unavailable
- duplicate capture
```

Commit: `feat: add physical observation and OCR pipeline`

---

# 11. FOUR ENTRY POINTS + WAKEUP ORCHESTRATOR

```text
Implement ONE orchestration layer for all activation paths.

WakeUpSource:
WAKE_WORD
ORB
MIND_PULSE
APP_ICON

WakeUpEvent:
source
timestamp
sessionId
payload
capabilities

WakeUpOrchestrator:
activate(event)
route(event)
cancel()
getCurrentSession()

Path 1:
“Hey NIA”
→ activate
→ orb
→ LISTENING
→ voice pipeline

Path 2:
Orb tap/hold / circle interaction
→ verification/action mode
→ current context

Path 3:
3-finger swipe up
→ Mind Pulse
→ capture/extract/verify

Path 4:
App icon
→ full NIA screen

CRITICAL:
Expo Go cannot provide arbitrary always-on Android foreground services or system-wide AccessibilityService behavior.

Therefore:
ExpoWakeUpAdapter = in-app/demo triggers
NativeWakeUpAdapter = native development-build boundary

All paths produce the same WakeUpEvent and enter the same orchestrator.

Do not duplicate business logic per trigger.
Do not create four independent assistant implementations.

Show capability status in debug/developer UI:
supported
simulation
unavailable

Never tell the user “Hey NIA is always listening” in Expo Go.
```

Commit: `feat: add unified NIA wake-up orchestration`

---

# 12. CONNECT ORB TO REAL AGENT FLOW

```text
Connect the Orb state machine to actual orchestrated work.

Canonical flow:
IDLE
→ LISTENING
→ THINKING
→ VERIFYING
→ VERIFIED or DRIFT
→ SPEAKING
→ ACTION_PENDING
→ SUCCESS

Error path:
any state
→ ERROR
→ recover/cancel
→ IDLE

Response hierarchy:
1. concise answer
2. truth status
3. evidence
4. impact
5. action proposal

Example:
“Your presentation location changed.”

Then:
Digital: Room 204
Observed: Room 302
Confidence: High

Actions:
Why?
What changed?
What does this affect?
Fix it

The Orb should reflect the actual orchestration state, not an animation pretending to think.

Create an AgentSession controller/state store so:
- one session has one ID
- events are ordered
- cancellation works
- duplicate requests do not create duplicate actions
- UI can replay the session

Add loading/error/retry behavior.

Do not create generic chat history as the primary UX.
```

Commit: `feat: connect NIA orb to agent response flow`

---

# 13. MIND PULSE

```text
Implement Mind Pulse as a first-class verification workflow.

Concept:
3-finger swipe up
→ pulse
→ capture current screen
→ extract visible information
→ identify events/commitments/locations/deadlines/tasks/people/decisions
→ compare with NIA's known state
→ show verified or drift result

In-app Expo Go:
implement a real 3-finger gesture detector inside NIA and a simulated “current screen” adapter.

Native development build:
define adapter boundaries for:
AccessibilityService and/or MediaProjection
screen capture
permission education
native gesture/system trigger

Never silently collect arbitrary screen content.
Require explicit enablement for AccessibilityService.
Explain what content may be read and how it is used.

UI states:
“Mind Pulse”
“Reading current screen…”
“Extracting context…”
“Reality check complete”

If drift:
show concise conflict.

If verified:
show confirmation.

If low confidence:
show “Needs review” instead of inventing certainty.

Do not make Mind Pulse depend on an LLM for basic room/time comparison.
```

Commit: `feat: add Mind Pulse verification workflow`

---

# 14. LOCAL AI RUNTIME — PHONE ONLY

```text
Create the pluggable local AI runtime.

Interfaces:
STTProvider
LLMProvider
TTSProvider
OCRProvider

Providers:
DemoProvider
DeviceLocalProvider
CloudFallbackProvider interface only

ModelManager:
discover
download
verify checksum
install
load
unload
delete
status

ModelManifest:
name
version
size
format
quantization
runtime
capabilities
minimum device requirements
checksum
storage requirement

Rules:
- models live on phone
- no model weights in Git
- no Render model loading
- no model download during Render startup
- lazy load
- unload when idle
- avoid STT + LLM + translation simultaneously
- never block UI while model loads
- expose loading/error states

Architecture:
Deterministic VEYRA logic first.
LLM only for:
- language understanding
- explanation
- extraction where rules are insufficient

If local model unavailable:
use deterministic/demo fallback honestly.

Do not hard-code one model into business logic.
Do not make the entire app unusable if a model is missing.

Create a capability report:
local STT available?
OCR available?
local LLM available?
TTS available?
native runtime available?
memory/storage sufficient?

Add developer diagnostics showing model state without exposing private model paths unnecessarily.
```

Commit: `feat: add pluggable local AI runtime`

---

# 15. VOICE INTERACTION SHELL (DO NOT OWN COMMITMENT EXTRACTION)

```text
Implement the shared voice shell only.

Flow:
wake word/mic
→ STTProvider
→ transcript
→ IntentRouter
→ NIA Orchestrator

Supported intents:
NEXT_MEETING
VERIFY_INFORMATION
WHAT_CHANGED
WHY
WHAT_AFFECTS
FIX_IT
CANCEL
HELP

Example queries:
“What’s my next meeting?”
“Is my presentation information still correct?”
“What changed?”
“Why?”
“What does this affect?”
“Fix it.”

Voice UI:
- permission education
- listening indicator
- live transcript preview
- stop/cancel
- processing state
- result
- optional system TTS

Important:
Do NOT implement commitment extraction.
Do NOT create a competing commitment schema.
Leave:
COMMITMENT_EXTRACT
as an extension point for Bhupathi.

Create IntentRouter interface.
Keep voice-specific code under:
frontend/src/features/voice/

Text input must be able to exercise the same intent router so voice is not required for testing.

If microphone permission is denied:
offer text input.

If STT unavailable:
allow typed transcript/demo provider.

Use system TTS for prototype unless a local TTS provider is ready.
```

Commit: `feat: add NIA voice interaction shell`

---

# 16. OFFICE KIT + REALITY AUDIT EXPORT

```text
Implement Office Kit value while keeping the phone primary.

Phone workflow:
capture
→ observe
→ verify
→ reason
→ propose
→ approve

Office Kit:
screen mirror
→ review
→ file transfer/export

Reality Audit must contain:
session ID
date/time
entity
previous state
current state
digital evidence
physical evidence
timestamps
confidence
drift reason
impact
proposed action
approval state
final action result
timeline

Generate a clean, readable PDF/report.
Avoid a huge technical dump.

Report sections:
NIA Reality Audit
1. Session
2. What NIA knew
3. What was observed
4. Reality Drift
5. Evidence
6. Impact
7. Proposed Action
8. Approval
9. Result
10. Timeline

Use a portable report format.
Keep export generation deterministic.

Do not make the laptop the main UI.
Do not create a desktop clone of NIA.

Demo export:
Room 204 → Room 302
with evidence and approved reminder update.
```

Commit: `feat: add Reality Audit export for Office Kit`

---

# 17. SETTINGS + PRIVACY + ACCESSIBILITY

```text
Create a polished settings system.

Sections:

AI & Models
- local AI availability
- model storage
- download
- delete
- online fallback preference

Wake-up
- Hey NIA status
- Orb
- Mind Pulse
- native sensitivity where supported

Permissions
- microphone
- camera
- calendar
- notifications
- AccessibilityService in native builds only

Privacy
- local processing
- evidence retention
- delete evidence
- cloud upload policy
- recording consent

Accessibility
- TalkBack labels
- large controls
- reduced motion
- haptics toggle
- visual captions

Rules:
Never request a permission without explaining why.
Never imply background microphone support in Expo Go.
Never silently enable AccessibilityService.
Never hide whether evidence is local/cloud.

Persist settings locally.
Create typed SettingsState.
Add migration/version handling so future setting changes do not corrupt stored data.

Add a diagnostics page:
backend target
native capability status
AI provider
model status
app version
demo mode

Do not expose secrets.
```

Commit: `feat: add NIA settings privacy and accessibility controls`

---

# 18. DETERMINISTIC END-TO-END DEMO MODE

```text
Create a deterministic hackathon demo mode.

The demo must never depend on random LLM output.

Scenario:
1. Calendar:
Final Presentation — 09:00 — Room 204
2. Activate NIA.
3. Orb appears.
4. Ask:
“Is my presentation information still correct?”
5. NIA enters VERIFYING.
6. Physical notice:
“Presentations moved to Room 302.”
7. OCR/observation produces Room 302.
8. VEYRA X detects location drift.
9. Evidence Replay:
Calendar = Room 204
Notice = Room 302
10. Impact:
presentation → reminder → alarm → commitment if available
11. User taps Fix it.
12. Safe Action Gate asks approval.
13. User approves.
14. Reminder mock/native adapter updates.
15. NIA shows SUCCESS.
16. Timeline records change.
17. Reality Audit exports.

Create a single demo scenario controller/fixture.
Do not scatter hardcoded strings across components.

Allow demo reset.
Allow step-by-step developer controls for testing.
User-facing UI should still look natural; developer/debug mode can label fixtures.

Add an end-to-end test that runs:
fixture
→ observation
→ VEYRA
→ evidence
→ impact
→ action
→ approval
→ result
→ timeline
→ export.

The same architecture must support real adapters later.
```

Commit: `feat: add deterministic NIA hackathon demo mode`

---

# 19. INTEGRATE BHUPATHI'S COMMITMENT MODULE

```text
Bhupathi provides VoiceMemo/Commitment Intelligence as an isolated module.

Integrate, do not rewrite.

Expected:
meeting/conversation transcript
→ Commitment Intelligence
→ Commitment {
 id
 owner
 action
 deadline
 source
 status
 confidence
 evidenceRef
 relatedEventId
 relatedLocation
 }
→ Unified Memory
→ Reality Graph link

Example:
“Sanjay will submit the slides by Friday.”

When Room 204 → Room 302 drift occurs:
Impact Graph should be able to query related commitments.

Integration rules:
- one Commitment schema only
- use shared contract
- do not duplicate extraction
- do not move Bhupathi files unnecessarily
- adapt at the boundary if names/types differ
- preserve his tests

Create:
CommitmentAdapter
getCommitmentsForEntity()
getCommitmentsForEvent()
getCommitmentsForLocation()

If a related commitment becomes affected:
do not automatically mark it AT_RISK unless the evidence/rules justify that state.
Prefer a reasoned impact record.

Run:
Bhupathi module tests
core tests
integration tests
full demo

Check route collisions and dependency changes.
```

Commit: `feat: integrate commitment intelligence module`

---

# 20. NATIVE ANDROID CAPABILITY BOUNDARIES

```text
Prepare a native development-build/APK architecture without breaking Expo Go.

Native-only candidates:
- always-on wake-word foreground service
- system-wide Mind Pulse
- AccessibilityService
- MediaProjection/screen capture
- native ML Kit OCR
- local model runtime

For each capability create a matrix:
Capability
Expo Go
Expo development build
Android APK
Permission
Data handled
Fallback
Status

Create adapter interfaces:
WakeWordNativeAdapter
SystemGestureAdapter
ScreenCaptureAdapter
NativeOCRAdapter
LocalModelRuntimeAdapter

Rules:
- Expo Go must still launch
- unsupported native features must not crash
- never implement fake background services in JavaScript
- no hidden permission requests
- no silent screen collection
- no always-on microphone claim unless actually implemented

Add capability detection:
isSupported()
reason()
fallback()

When unsupported:
show:
“This capability requires the NIA Android development build.”
Then offer the in-app/demo alternative.

Keep native code isolated so future native implementation does not infect business logic.
```

Commit: `feat: add native capability boundaries`

---

# 21. PHONE-FIRST PERFORMANCE + MEMORY

```text
Optimize for a high-end iQOO phone but design safely for real memory limits.

Rules:
- minimize re-renders
- memoize expensive components
- lazy-load screens
- lazy-load models
- unload models when idle
- resize/compress evidence thumbnails
- avoid duplicate image copies
- do not upload raw images by default
- do not run multiple heavy models simultaneously
- keep animations bounded
- cancel stale async work

Create a simple resource coordinator:
IDLE
STT_ACTIVE
OCR_ACTIVE
LLM_ACTIVE
TTS_ACTIVE
TRANSITION

Only allocate heavy resources when required.

Model sequence example:
capture → OCR → release OCR resources → LLM explanation → release LLM → TTS

Never assume 16 GB RAM means all models can remain resident.
Use capability checks.

Add performance diagnostics:
screen render time
API latency
OCR duration
model load time
model memory estimate if available
image size
session duration

Avoid collecting excessive analytics.
```

Commit: `perf: optimize NIA for phone-first execution`

---

# 22. FAILURE STATES + TESTING

```text
Create a complete test strategy.

Backend:
- unit tests
- service tests
- repository tests
- API tests

Frontend:
- component tests where configured
- state machine tests
- adapter tests
- critical interaction tests

Integration:
digital + physical
→ VEYRA
→ evidence
→ impact
→ action
→ approval
→ timeline

Test failures:
- backend unavailable
- Render cold start
- LAN IP changed
- malformed response
- OCR unavailable
- camera denied
- calendar denied
- microphone denied
- STT unavailable
- local model missing
- model too large
- low confidence OCR
- stale evidence
- duplicate event
- duplicate action
- action execution failure
- user rejects action
- export failure
- native capability unavailable

Safety tests:
- UI cannot execute action directly
- rejected action remains rejected
- approval cannot be reused incorrectly
- no silent mutations
- no secret logging
- no raw image upload by default

Run clean-start tests.
```

Commit: `test: add NIA end-to-end and failure-state coverage`

---

# 23. RENDER DEPLOYMENT SAFE MODE

```text
Prepare FastAPI for a free/low-resource Render deployment.

Render must contain only:
- API routing
- deterministic VEYRA logic
- lightweight repositories
- structured observations
- evidence metadata
- action proposals
- timeline metadata
- health/readiness

Render must NOT:
- load local LLM
- load Whisper/Moonshine model weights
- load large OCR models
- download model weights at startup
- run an always-on inference worker
- require the phone to upload raw camera images

Environment variables:
CORS_ORIGINS
DATABASE_URL if used
APP_ENV
LOG_LEVEL
other genuinely required secrets only

No secrets in Git.

Add:
- health endpoint
- readiness endpoint
- startup-safe configuration
- bounded request sizes
- timeouts
- structured errors
- no stack traces to users

Document Render deployment and cold-start behavior.

Test:
fresh process
health
reality-check request
action proposal
no local model installed
```

Commit: `chore: prepare lightweight Render deployment`

---

# 24. FINAL UI POLISH

```text
Perform a dedicated visual QA pass.

Do not add new architecture.
Do not add random features.

Polish:
- Orb proportions
- glow restraint
- typography
- spacing
- button hierarchy
- evidence cards
- drift visualization
- timeline
- action approval
- loading states
- error states
- empty states
- accessibility
- reduced motion
- haptics
- keyboard behavior
- safe areas

The first 5 seconds should communicate:
NIA is an AI assistant.
NIA is observing/verifying reality.
The Orb is its identity.

Avoid:
- generic dashboard look
- excessive gradients
- excessive text
- tiny buttons
- fake technical jargon
- unnecessary charts

Test on a real phone.
Check light/dark only if product design supports it; do not create a second visual system unnecessarily.

Do not break performance while polishing.
```

Commit: `ui: polish NIA phone-first experience`

---

# 25. FINAL HACKATHON DEMO QA

```text
Run the exact demo from a clean launch.

Target narrative:
“Is what I know still true?”

Sequence:
1. launch app
2. show NIA Orb
3. activate NIA
4. ask verification question
5. show digital state Room 204
6. show physical notice Room 302
7. Mind Pulse/observation
8. VEYRA Drift
9. Evidence Replay
10. Impact Graph
11. Fix it
12. Safe Action Gate
13. Approve
14. updated state
15. Timeline
16. Reality Audit
17. Office Kit review/export

Also test:
- app icon path
- Orb path
- Mind Pulse path
- supported voice path
- Expo Go fallback path
- Render path
- LAN path

Record actual:
startup time
API latency
OCR latency
model availability
native limitations

Do not claim unsupported features.
Prepare a 1–2 minute deterministic demo.
```

Commit: `test: finalize NIA hackathon demo`

---

# 26. FINAL REPOSITORY CLEANUP

```text
Before handoff:
- remove dead code
- remove debug logs containing sensitive data
- remove temporary screenshots/assets
- remove unused dependencies
- remove model weights
- remove secrets
- remove duplicate schemas
- remove duplicate adapters
- verify imports
- verify README
- verify docs
- verify .gitignore
- verify package lock files
- verify backend requirements
- verify tests

Run:
git status
git diff
frontend checks
backend checks
integration tests

Print:
1. exact tree
2. changed files
3. tests
4. build status
5. known limitations
6. native-only features
7. local AI status
8. Render status
9. demo status

Do not push until this report is clean.
```

---

# 27. FINAL SANJAY GIT HANDOFF

```text
Only after the repository is clean:

git status
git add .
git commit -m "feat: establish NIA core architecture and VEYRA integration"
git push origin main

Do NOT force push.

Then create/prepare:
feature/bhupathi-commitment-intelligence

Bhupathi must work on his branch.
main remains stable.

Before handing off, ensure these docs are present:
docs/MODULE_OWNERSHIP.md
docs/API_CONTRACT.md
docs/ARCHITECTURE.md
docs/DEVELOPMENT_RULES.md

Tell Bhupathi:
- his owned folders
- forbidden shared files
- branch name
- test command
- API contract
- how to report shared-contract needs

Never ask both developers to edit the same shared file simultaneously.
```

---

# 28. FINAL INTEGRATION AFTER BHUPATHI PR

```text
Bhupathi's PR is ready.

Do not merge immediately.

First inspect:
git diff main...feature/bhupathi-commitment-intelligence

Verify:
- only owned areas changed
- no unnecessary shared-file changes
- no duplicate schemas
- no route collision
- no dependency conflict
- no secrets
- no model weights
- no global navigation rewrite
- no NIA Orb rewrite
- no VEYRA rewrite
- no Render rewrite

Then run:
frontend tests
backend tests
module tests
integration tests
clean build
Room 204 → Room 302 demo

Integration boundary:
transcript
→ commitment module
→ shared Commitment
→ Unified Memory
→ Reality Graph
→ Impact Graph

If mismatch:
adapt at boundary.
Do not rewrite the module.

If conflict is in Sanjay-owned architecture:
stop and inspect manually.
Do not choose “ours/theirs” blindly.
Do not use destructive reset commands.

Merge only after all checks pass.
```

---

# 29. FINAL RELEASE CHECKLIST

```text
Before hackathon:
[ ] App icon opens NIA
[ ] NIA Orb is polished
[ ] Voice path works where supported
[ ] Expo Go fallback is honest
[ ] Mind Pulse in-app gesture works
[ ] Native capability matrix is documented
[ ] Digital calendar state works
[ ] Physical OCR/observation works
[ ] Room 204 → Room 302 drift works
[ ] Evidence Replay works
[ ] Reality Timeline works
[ ] Impact Graph works
[ ] Safe Action Gate works
[ ] Commitment module integrated
[ ] Reality Audit exports
[ ] Office Kit workflow is demonstrable
[ ] Render backend works
[ ] LAN backend works
[ ] Local AI is phone-side where installed
[ ] Render does not load local models
[ ] No secrets committed
[ ] No model weights committed
[ ] Tests pass
[ ] Docs complete
[ ] Git history clean
[ ] Demo works from clean launch
[ ] Known limitations are explicitly documented
```

## FINAL RULE FOR GEMINI ANTIGRAVITY

**One prompt = one implementation milestone.**

After every prompt:
1. inspect
2. implement only that scope
3. run relevant checks
4. fix only related failures
5. show changed files
6. show tests
7. show remaining limitations
8. stop

Never silently continue into the next prompt.
