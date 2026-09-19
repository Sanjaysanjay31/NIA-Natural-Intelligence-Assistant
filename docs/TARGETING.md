# NIA — Backend Targeting & Mobile Connectivity Guide

This guide details how NIA routes API communication across mobile runtimes (Expo Go, Android APK) and backend targets (Render Cloud, Localhost, Laptop LAN).

---

## 1. Targeting Precedence Rules

When determining the active API Base URL, `resolveApiBaseUrl()` evaluates in strict order:

1. **Tier 1: Explicit Runtime / Custom Override**
   - Value set dynamically via `setCustomBackendUrl(url)` or the Targeting Modal.
2. **Tier 2: Environment Variable Override (`EXPO_PUBLIC_API_BASE_URL`)**
   - Explicitly configured in `.env` or CI build pipeline.
3. **Tier 3: Selected Backend Target (`render` | `lan`)**
   - If `render`: Uses `https://nia-backend.onrender.com` (or `EXPO_PUBLIC_RENDER_API_URL`).
   - If `lan`: Uses `http://${LAPTOP_WIFI_IP}:${API_PORT}` (default port `8000`).
4. **Tier 4: Safe Local Development Default**
   - Falls back to `http://localhost:8000`.

---

## 2. Deployment Configurations

### 2.1 Physical Phone + Expo Go + Laptop LAN (Primary Local Testing)
When pair-testing between your computer and a physical iQOO phone on the same Wi-Fi:
* The phone cannot access `http://localhost:8000` because `localhost` refers to the phone itself.
* Use your laptop's Wi-Fi IPv4 address (e.g. `http://192.168.1.100:8000`).
* Set in `.env`:
  ```bash
  EXPO_PUBLIC_BACKEND_TARGET=lan
  EXPO_PUBLIC_LAPTOP_WIFI_IP=192.168.1.100
  ```
* Or switch live using the in-app `⚙` settings entry.

### 2.2 Phone + Expo Go + Render Cloud (Zero-Config Testing)
* Ideal when laptop and phone are on different Wi-Fi networks (e.g. mobile hotspot or guest networks with client isolation).
* Set in `.env`:
  ```bash
  EXPO_PUBLIC_BACKEND_TARGET=render
  EXPO_PUBLIC_RENDER_API_URL=https://nia-backend.onrender.com
  ```

### 2.3 Android Standalone Build (APK) + Render (Production Mode)
* Production builds bundle `EXPO_PUBLIC_BACKEND_TARGET=render`.
* Android Manifest requires `android.permission.INTERNET`.

---

## 3. How to Find Your Laptop IPv4 Address

### Windows (PowerShell):
```powershell
ipconfig
```
Look for `Wireless LAN adapter Wi-Fi` -> `IPv4 Address`: `192.168.x.x`.

### macOS / Linux:
```bash
ifconfig | grep "inet "
# or
ip route get 1.1.1.1 | awk '{print $7}'
```

---

## 4. Android Network Security & Troubleshooting

1. **Cleartext HTTP Traffic:**
   Android 9+ prohibits cleartext HTTP by default. Expo Go handles local IP development traffic cleanly. For standalone APK builds targeting LAN HTTP, `network_security_config.xml` must permit the local subnet or Render HTTPS should be used.
2. **Wi-Fi Client Isolation:**
   University or corporate Wi-Fi often blocks direct peer-to-peer traffic between your laptop and phone. If connection times out on LAN, switch to mobile hotspot or use Render Cloud.
3. **Windows Firewall:**
   Ensure port 8000 is open in Windows Defender Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "NIA FastAPI" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```
