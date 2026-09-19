# NIA — Security, Privacy & Accessibility Architecture
> **Enterprise Privacy Invariants, On-Device Data Residency & Inclusive Design Standards**

---

## 🔒 1. Foundational Privacy Invariants

Most AI assistants compromise user privacy by continuously streaming background audio and video feeds to remote cloud servers. **NIA takes the opposite stance**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE NIA PRIVACY CHARTER                                   │
│  1. Evidence Residue: 100% On-Device. All raw photos, OCR tokens, and voice audio stay │
│     in private, sandboxed app storage.                                                │
│  2. Cloud Upload Policy: NEVER. Raw media is NEVER uploaded to cloud servers.          │
│  3. Zero Silent Permissions: No permission is requested without upfront explanation.  │
│  4. Zero Silent Accessibility: AccessibilityService is NEVER silently enabled.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. Platform Permission Education Architecture

Android applications frequently deter users by triggering abrupt, unexplained system permission popups. NIA mandates an **Explain-Before-Prompt** model:

```mermaid
sequenceDiagram
    autonumber
    participant User as Primary User
    participant App as Settings / Feature UI
    participant Modal as Pre-Flight Education Modal
    participant Android as Android OS System Settings

    User ->> App: Toggles Permission (e.g. Camera)
    App ->> Modal: Displays "Why NIA Needs Camera"
    Note over Modal: Explains that frames are processed<br/>locally via ML Kit and never uploaded.
    alt User Denies
        User ->> Modal: Taps "Deny"
        Modal ->> App: Permission stays disabled; offers simulation
    else User Allows
        User ->> Modal: Taps "Allow"
        Modal ->> Android: Triggers native OS permission dialog
    end
```

### Permission Policies Table

| Permission | Justification | On-Device Scope | Cloud Policy |
| :--- | :--- | :--- | :--- |
| **Microphone** | Voice interaction when Orb is active | Processed by local Whisper Tiny / Android Speech | Raw audio is **never** uploaded |
| **Camera** | Scanning physical notices (doors, posters) | Processed by local Google ML Kit OCR | Raw frames are **never** uploaded |
| **Calendar** | Establishing digital ground truth | Read-only access to synchronize scheduled events | Calendar data cached locally |
| **Notifications** | High-confidence reality drift alerts | Dispatches local Android notifications | No remote notification servers |
| **AccessibilityService** | **Mind Pulse** on-screen reality checking | Active UI text node extraction during gesture | Password/banking nodes **strictly ignored** |

---

## 🔍 3. System Diagnostics & Zero-Secret Guarantee

The `SettingsScreen` provides real-time system introspection for hackathon judges and users without leaking confidential infrastructure tokens:

```json
{
  "backend_target": "local_lan",
  "native_capability_status": "Expo Go Sandbox (Demo Mode)",
  "ai_provider": "On-Device Deterministic VEYRA X + ML Kit",
  "model_status": "Whisper Tiny & MLKit Active",
  "app_version": "0.1.0-alpha",
  "demo_mode": true
}
```

### Automated Invariant Verification
Our automated test suite (`tests/backend/test_settings_and_privacy.py`) explicitly scans all diagnostic endpoints to guarantee:
- Zero API keys, passwords, bearer tokens, or database credentials are leaked in serialized responses.
- All secrets reside strictly in `.env`, which is permanently excluded by `.gitignore`.

---

## ♿ 4. Accessibility & Inclusive Design Standards

NIA is engineered to ensure seamless accessibility for users with varying visual, motor, and cognitive abilities:

### 1. TalkBack & Screen Reader Support
- Every interactive element (Orb, Safe Gate buttons, Evidence Replay cards) declares semantic `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint`.

### 2. High-Contrast Large Touch Controls
- Users can toggle **Large Controls** in Settings, expanding touch targets from standard 44px to **56px+** to assist users with fine-motor tremors or visual impairments.

### 3. Reduced Motion Safeguards
- When **Reduced Motion** is enabled:
  - Particle glow physics around the NIA Orb are suspended.
  - Screen transitions switch from spring slides to clean instantaneous cross-fades.

### 4. 4D Haptic Feedback
- Discrete vibrational signatures confirm key state changes:
  - Single pulse: Wake-up trigger registered.
  - Double pulse: Reality drift detected.
  - Triple pulse: Safe action executed successfully.

### 5. Live Visual Captions
- A transcription preview displays live spoken words on-screen during voice queries, ensuring complete usability for deaf and hard-of-hearing users.

---

## 🗄️ 5. Versioned Migration & Data Integrity

To prevent stored settings or user evidence from being corrupted during application updates, the settings subsystem includes an automated **Version Migration Handler**:

```typescript
export class SettingsStorage {
  public migrateSettings(rawStored: any): SettingsState {
    const version = rawStored?.version || 0;
    let migrated = { ...rawStored };

    if (version < 1) {
      // Migrate v0 legacy state -> v1: guarantees privacy and accessibility keys
      migrated = {
        ...DEFAULT_SETTINGS,
        ...migrated,
        privacy: { ...DEFAULT_SETTINGS.privacy, ...(migrated.privacy || {}) },
        accessibility: { ...DEFAULT_SETTINGS.accessibility, ...(migrated.accessibility || {}) },
        version: 1,
      };
    }
    return migrated as SettingsState;
  }
}
```
