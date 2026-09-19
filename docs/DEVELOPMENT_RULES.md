# NIA — Development Rules & Engineering Standards

## 1. Core Engineering Invariants

### 1.1 Safety Gate Rule (Non-Negotiable)
* **No Direct Mutations:** The frontend UI can **never** directly mutate user calendar, alarm, reminder, or messaging state.
* **Gate Enforcement:** All consequential actions **must** pass through the **Safe Action Gate**.
* **Audit Provenance:** Every action proposal must store:
  - `before_state`: Snapshot of the digital state prior to action.
  - `after_state`: Proposed target state.
  - `evidence_refs`: Array of IDs referencing specific physical/digital observations.
  - `approval_required`: Boolean, default `True`.

### 1.2 Deterministic VEYRA X Rule
* VEYRA X reality detection logic (normalization, equality checks, drift classification, impact analysis) must function deterministically without requiring an external LLM.
* If an LLM is offline or unavailable, the system must still reliably detect `LOCATION_CHANGED`, `TIME_CHANGED`, and `STATUS_CANCELLED`.

### 1.3 Honesty in Mobile Capabilities
* Never write fake native code or simulate background system services inside Expo Go without making it explicitly clear in the UI and debug banners.
* Use adapter interfaces (`IOcrAdapter`, `IWakeWordAdapter`, `IGestureAdapter`) so code seamlessly switches between `SimulationAdapter` in Expo Go and `NativeAdapter` in Android standalone builds.

---

## 2. Frontend Standards (React Native + Expo)

* **Language:** Strict TypeScript (`strict: true` in `tsconfig.json`).
* **Design Philosophy:** Dark cinematic interface, custom modern typography, responsive spacing, restrained glow effects, and micro-animations. Avoid generic flat-styled default mobile components.
* **Component Modularity:**
  - `components/`: Atomic reusable UI primitives (Buttons, Cards, Badges, Modals, NIA Orb).
  - `features/`: Screen-level functional modules (`features/reality/`, `features/actions/`, `features/timeline/`).
  - `contracts/`: TypeScript definitions strictly aligned with backend Pydantic schemas.
* **State Management:** Predictable state updates. Avoid deep prop-drilling.
* **Testing:** Component testing with Jest and React Native Testing Library.

---

## 3. Backend Standards (FastAPI + Pydantic v2)

* **Python Version:** Python 3.11+ (running on Python 3.13 in active environment).
* **Architecture:** Layered Separation:
  - `app/api/`: HTTP routes, query validation, and status code dispatching.
  - `app/schemas/`: Pydantic v2 models representing the domain contracts.
  - `app/services/`: Pure business logic and VEYRA X orchestration.
  - `app/repositories/`: Abstracted data access layers.
* **Type Annotations:** Full type hinting (`mypy` compliant).
* **Async by Default:** Async FastAPI route handlers for all I/O operations.
* **Testing:** Pytest test suites covering route validation, schema serialization, and drift logic.

---

## 4. Git & Commit Guidelines

* **Conventional Commits:** Use standard semantic prefixes:
  - `feat:` A new feature or domain contract
  - `fix:` A bug fix
  - `chore:` Repository maintenance, configuration, dependencies
  - `docs:` Documentation updates
  - `test:` Test suites and fixtures
  - `refactor:` Code restructuring without behavioral changes
* **Ownership Integrity:**
  - Sanjay owns 60% Core (Architecture, UI, Orb, VEYRA X, Safe Action Gate, Backend Core).
  - Bhupathi owns 40% Module (`backend/app/modules/commitments/`, `frontend/src/features/commitments/`, `frontend/src/features/voiceMemo/`).
  - Commits in one engineer's area must never accidentally rewrite or break the other's isolated module.

---

## 5. Antigravity Agent Execution Rule

1. **One Prompt at a Time:** Gemini Antigravity must execute exactly ONE prompt at a time.
2. **Stop, Test, Report, Wait:** After implementing a prompt, Antigravity must:
   - Run install / type / lint / test checks.
   - Show the exact tree and files modified.
   - Stop and wait for user review before moving to the next prompt.
3. **No Premature Feature Bloat:** Implement only the scope specified in the active prompt.
