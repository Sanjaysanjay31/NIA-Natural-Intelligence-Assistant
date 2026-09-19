# NIA — Local AI & Render Architecture Boundaries

## 1. Core Architectural Principle

> **AI compute belongs on the phone. The cloud backend on Render must remain lightweight, fast, and deterministic.**

NIA is designed as a phone-first intelligence layer. Mobile devices today (specifically the target iQOO flagship phone powered by Snapdragon NPU) possess dedicated tensor accelerators capable of on-device vision, speech parsing, and embedding generation. Offloading these tasks to heavy cloud servers introduces latency, bandwidth consumption, privacy exposure, and unsustainable hosting costs.

---

## 2. Platform Division Matrix

| Capability | Phone (iQOO Android Device) | Cloud Backend (Render) | Rationale |
| :--- | :--- | :--- | :--- |
| **Wake Word Detection** | ✅ On-device Porcupine / native engine | ❌ Never | Zero network latency required for instant responsiveness |
| **Optical Character Recognition (OCR)** | ✅ Google ML Kit on-device text recognition | ❌ Never | Image frames remain private on user's phone; zero upload lag |
| **Deterministic Reality Drift** | ✅ Fast client pre-check | ✅ Primary VEYRA X validation | Deterministic rules execute in microseconds without an LLM |
| **Impact Graph Traversal** | ❌ (Client renders UI) | ✅ Primary graph query | Relational graph traversed against stored user state |
| **Speech-to-Text Transcription** | ✅ Local Whisper.tflite / Android Speech | ❌ Never | Voice memos parsed locally on-device |
| **Natural Language Explanations** | ⚠️ Optional small quantized on-device LLM | ⚠️ Optional lightweight cloud LLM API (OpenAI/Anthropic/Gemini) | Fallback to templated deterministic strings if offline |
| **Model Weights Storage** | ✅ On phone internal app storage | ❌ **STRICTLY PROHIBITED** | Free/starter Render instances (512MB RAM) crash on multi-GB weights |

---

## 3. Render Deployment Constraints

1. **No Multi-Gigabyte Weight Downloads:**
   Render build or start scripts must **never** execute `huggingface-cli download`, `git lfs pull`, or load 3GB+ `.bin`/`.safetensors`/`.gguf` files into RAM.
2. **Deterministic VEYRA X Logic:**
   The entire VEYRA X pipeline (Normalization, Truth comparison, Drift detection, Impact determination, Action proposal) is written in pure Python using deterministic algorithms, regex, and structured entity matching.
   * **If cloud AI is unavailable or unconfigured, 100% of the core hackathon demo still succeeds deterministically.**
3. **RAM Ceiling:**
   FastAPI application must comfortably stay under 200 MB RSS memory usage under standard operation.
4. **Stateless Scalability:**
   All persistent state resides in SQLite (local dev) or managed PostgreSQL.

---

## 4. On-Phone (iQOO) AI Resource Management

To maintain phone responsiveness, battery health, and thermal stability:

1. **Lazy Loading:**
   Models (OCR, audio transcription) are only loaded into memory when their respective feature is triggered (e.g., camera opens or voice memo record button is pressed).
2. **Sequential Execution:**
   Never run on-device OCR and speech transcription simultaneously. Resources are queued sequentially:
   `Capture -> Transcribe -> Free buffer -> OCR -> Free buffer -> VEYRA X Evaluation`.
3. **Graceful Degradation:**
   If on-device hardware acceleration is unavailable (e.g. running in Expo Go development mode on an emulator), NIA transparently falls back to `SimulationOcrAdapter` which provides deterministic test fixtures.

---

## 5. Security & Repository Hygiene

* **Zero Model Weights in Git:**
  Git repositories must remain compact and fast to clone. `.gitignore` explicitly filters out all `.onnx`, `.tflite`, `.pt`, `.pth`, `.bin`, `.gguf`, and `.safetensors` files.
* **Zero API Secrets in Git:**
  Any external API keys (for optional cloud LLMs or cloud sync) must reside exclusively in `.env`, which is strictly excluded from version control.
