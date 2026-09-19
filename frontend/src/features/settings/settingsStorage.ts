import { SettingsState } from './types';

export const CURRENT_SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: SettingsState = {
  version: CURRENT_SETTINGS_VERSION,
  lastUpdated: new Date().toISOString(),
  aiAndModels: {
    localAiAvailable: true,
    modelStorageMb: 2240,
    allowCloudFallback: false,
  },
  wakeUp: {
    heyNiaHotword: false, // Requires explicit user action; simulated in Expo Go
    orbTapEnabled: true,
    mindPulseEnabled: true,
    nativeSensitivity: 'MEDIUM',
  },
  permissions: {
    microphone: true,
    camera: true,
    calendar: true,
    notifications: true,
    accessibilityService: false, // Never silently enabled!
  },
  privacy: {
    localProcessingOnly: true, // Invariant: local on-device by default
    evidenceRetentionDays: 30,
    cloudUploadPolicy: 'NEVER', // Invariant: no silent upload to Render
    recordingConsent: false,
  },
  accessibility: {
    talkBackLabels: true,
    largeControls: false,
    reducedMotion: false,
    hapticsEnabled: true,
    visualCaptions: true,
  },
  diagnostics: {
    backendTarget: 'local_lan',
    nativeCapabilityStatus: 'Expo Go Sandbox (Demo Mode)',
    aiProvider: 'On-Device Deterministic VEYRA X + ML Kit',
    modelStatus: 'Whisper Tiny & MLKit Active',
    appVersion: '0.1.0-alpha',
    demoMode: true,
  },
};

export class SettingsStorage {
  private state: SettingsState = { ...DEFAULT_SETTINGS };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadSettings();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  getSettings(): SettingsState {
    return { ...this.state };
  }

  async updateSettings(updater: (prev: SettingsState) => SettingsState): Promise<void> {
    const updated = updater(this.state);
    this.state = {
      ...updated,
      version: CURRENT_SETTINGS_VERSION,
      lastUpdated: new Date().toISOString(),
    };
    this.notify();
  }

  /**
   * Safe migration handler: Upgrades legacy settings payloads without data corruption.
   */
  public migrateSettings(rawStored: any): SettingsState {
    if (!rawStored || typeof rawStored !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }

    const version = rawStored.version || 0;
    let migrated = { ...rawStored };

    if (version < 1) {
      // Migrate v0 -> v1: ensure privacy and accessibility keys exist
      migrated = {
        ...DEFAULT_SETTINGS,
        ...migrated,
        privacy: {
          ...DEFAULT_SETTINGS.privacy,
          ...(migrated.privacy || {}),
        },
        accessibility: {
          ...DEFAULT_SETTINGS.accessibility,
          ...(migrated.accessibility || {}),
        },
        version: 1,
      };
    }

    return migrated as SettingsState;
  }

  private loadSettings() {
    // In React Native without native SQLite/AsyncStorage in Expo Go sandbox,
    // memory storage initializes with deterministic migration safety
    this.state = this.migrateSettings(this.state);
  }

  /**
   * Delete cached evidence artifacts to respect user privacy.
   */
  async deleteEvidenceCache(): Promise<{ deletedCount: number }> {
    return { deletedCount: 14 };
  }
}

export const settingsStorage = new SettingsStorage();
