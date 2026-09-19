# NIA — Environment & Configuration Guide

## 1. Environment Variables Specification

All configurable runtime settings are loaded from environment variables and validated through typed configuration loaders (e.g. `pydantic-settings` in the backend and Expo public environment variables in the frontend).

### 1.1 Backend Configuration (`.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | `str` | `development` | Deployment environment: `development`, `staging`, `production` |
| `API_HOST` | `str` | `0.0.0.0` | Host binding for FastAPI server |
| `API_PORT` | `int` | `8000` | Port binding for FastAPI server |
| `BACKEND_CORS_ORIGINS` | `list[str]` | `["*"]` | Allowed CORS origins for mobile and web clients |
| `LOG_LEVEL` | `str` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `SAFE_ACTION_AUTO_APPROVE` | `bool` | `false` | **Safety Override:** If `true`, bypasses approval (strictly for headless automated testing) |
| `DEBUG_SIMULATION_MODE` | `bool` | `true` | Loads deterministic sample fixtures for OCR and digital calendars |

### 1.2 Frontend Configuration (`.env` / Expo Public)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `str` | `http://localhost:8000` | Base URL of the backend API (or LAN IP when testing on physical phone) |
| `EXPO_PUBLIC_AI_RUNTIME` | `str` | `phone_local` | Primary AI execution location: `phone_local` or `cloud_fallback` |
| `EXPO_PUBLIC_ENABLE_SIMULATION_ADAPTERS` | `bool` | `true` | Enables mock camera/audio fixtures when running in Expo Go |

---

## 2. Local Development Setup

### 2.1 Prerequisites
* Python 3.11+ (Python 3.13 tested)
* Node.js v20+ (Node.js v24 tested) & npm v10+
* Git
* Android Device (e.g. iQOO phone) or Expo Go app installed

### 2.2 Backend Setup
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

### 2.3 Frontend Setup
```bash
cd frontend
npm install
npm run start
```
* Press `a` to open in Android emulator or scan the QR code with the Expo Go app on your physical iQOO device.
* When testing on a physical phone, set `EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:8000` so the phone can communicate with your local machine.

---

## 3. Deployment Constraints (Render vs. Mobile)

* **Backend on Render:**
  * Free/starter tier Render instances have limited RAM (512 MB to 2 GB) and no GPU acceleration.
  * **Strict Policy:** Render will **never** be configured to download or host multi-gigabyte models (e.g., Llama 7B, Whisper Large).
  * Render handles relational persistence, coordination, verification checks, and REST endpoints.
* **On-Phone AI (iQOO):**
  * Hardware acceleration via Qualcomm Snapdragon NPU / GPU.
  * Runs on-device ML Kit OCR, local wake word, and lightweight quantized models.
