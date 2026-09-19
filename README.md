# NIA — Natural Intelligence Assistant
> **Reality-Verified Personal Intelligence Layer** | Centered on: *“Is what I know still true?”*

NIA is a phone-native, evidence-first reality intelligence assistant. It continuously cross-references digital knowledge (calendars, reminders, alarms, notes) with physical observations (OCR notices, voice recordings, situational signals) to detect **Reality Drift** and propose verified, safe remediations through human-in-the-loop oversight.

---

## ⚡ Core Pillars

1. **VEYRA X Engine:** Internal reality intelligence pipeline:
   `Perception → Normalization → Truth → Drift → Evidence → Timeline → Impact → Action`
2. **Safe Action Gate:** No autonomous mutation of calendar/reminder state. Consequential changes strictly require explicit human verification and approval.
3. **Phone-First Local AI:** Heavy AI models live on the mobile device (iQOO phone). Cloud Render backend remains lightweight, fast, and deterministic.
4. **WakeUp Orchestration:** 4 entry points converge into a unified wake-up pipeline:
   - Voice trigger: *"Hey NIA"*
   - NIA Orb interaction: Tap, hold, or circle gesture
   - Mind Pulse: 3-finger swipe-up situational awareness
   - Application icon launch

---

## 📂 Repository Structure

```text
NIA/
├── frontend/                     # React Native + Expo phone application
│   ├── src/
│   │   ├── adapters/            # Native capability adapters (Expo Go vs Dev Build)
│   │   ├── components/          # Shared atomic UI components & NIA Orb
│   │   ├── config/              # Runtime environment & feature flags
│   │   ├── contracts/           # TypeScript domain contracts matching Pydantic
│   │   ├── features/            # Feature modules (Reality, Timeline, Actions, Mind Pulse)
│   │   │   ├── commitments/     # Isolated UI (owned by Bhupathi)
│   │   │   └── voiceMemo/       # Isolated VoiceMemo Pro (owned by Bhupathi)
│   │   ├── navigation/          # Navigation flows & modal gates
│   │   ├── services/            # API client and local perception services
│   │   ├── state/               # State management (Zustand/Context)
│   │   └── theme/               # Dark cinematic theme, tokens, animations
│   ├── package.json
│   └── tsconfig.json
├── backend/                      # FastAPI lightweight orchestration backend
│   ├── app/
│   │   ├── api/                 # REST endpoints & versioned route handlers
│   │   ├── core/                # App config, logging, middleware, security
│   │   ├── modules/
│   │   │   ├── actions/         # Safe Action Gate & action proposal logic
│   │   │   ├── commitments/     # Isolated module (owned by Bhupathi)
│   │   │   ├── digital_state/   # Calendar, reminder, alarm mock/sync sources
│   │   │   ├── evidence/        # Evidence bundle builder & provenance tracking
│   │   │   ├── physical_observation/ # Vision OCR & sensory ingestion
│   │   │   └── reality/         # VEYRA X reality drift & truth evaluation
│   │   ├── repositories/        # Persistence abstractions (in-memory / SQL)
│   │   ├── schemas/             # Pydantic v2 schemas for all domain contracts
│   │   └── services/            # Domain service coordination
│   ├── pyproject.toml
│   └── requirements.txt
├── docs/                         # Architectural, development, and ownership specs
│   ├── API_CONTRACT.md          # Versioned request/response contracts
│   ├── ARCHITECTURE.md          # Phone-first system architecture & VEYRA pipeline
│   ├── DEVELOPMENT_RULES.md     # Code conventions, safety gates, and git practices
│   ├── ENVIRONMENT.md           # Setup, configuration, and environment vars
│   ├── LOCAL_AI_AND_RENDER.md   # On-device AI vs lightweight Render boundary
│   ├── MODULE_OWNERSHIP.md      # Sanjay (60% core) vs Bhupathi (40% module)
│   └── PROJECT_OVERVIEW.md      # Product mission, core invariants, and hackathon story
├── scripts/                      # Verification, development, and lint scripts
└── tests/                        # Backend and frontend automated verification suites
```

---

## 👥 Module Ownership & Division of Responsibility

| Owner | Scope | Core Responsibilities |
| :--- | :--- | :--- |
| **Sanjay** | **60% Core System** | Core architecture, shared UI, NIA Orb, wake-up orchestration, VEYRA X engine, Reality Graph, Evidence Replay, Impact Graph, Safe Action Gate, Mind Pulse orchestration, backend core, integration, and final QA. |
| **Bhupathi** | **40% Isolated Module** | Commitment extraction, VoiceMemo Pro, commitment repository, schemas, isolated UI, tests, and documentation (`backend/app/modules/commitments/`, `frontend/src/features/commitments/`, `frontend/src/features/voiceMemo/`, `docs/COMMITMENT_MODULE.md`). |

---

## 🚀 Quickstart

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run local server
python -m uvicorn app.main:app --reload --port 8000
```

### Verification
```bash
python scripts/verify_foundation.py
pytest tests/
```

See [docs/PROJECT_OVERVIEW.md](file:///c:/Skills/Projects/NIA/docs/PROJECT_OVERVIEW.md) and [docs/ARCHITECTURE.md](file:///c:/Skills/Projects/NIA/docs/ARCHITECTURE.md) for full architectural details.
