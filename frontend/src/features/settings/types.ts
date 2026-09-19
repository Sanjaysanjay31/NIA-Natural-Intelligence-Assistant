export interface AIAndModelsSettings {
  localAiAvailable: boolean;
  modelStorageMb: number;
  allowCloudFallback: boolean;
}

export interface WakeUpSettings {
  heyNiaHotword: boolean;
  orbTapEnabled: boolean;
  mindPulseEnabled: boolean;
  nativeSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PermissionsSettings {
  microphone: boolean;
  camera: boolean;
  calendar: boolean;
  notifications: boolean;
  accessibilityService: boolean;
}

export interface PrivacySettings {
  localProcessingOnly: boolean;
  evidenceRetentionDays: number;
  cloudUploadPolicy: 'NEVER' | 'ON_EXPLICIT_APPROVAL';
  recordingConsent: boolean;
}

export interface AccessibilitySettings {
  talkBackLabels: boolean;
  largeControls: boolean;
  reducedMotion: boolean;
  hapticsEnabled: boolean;
  visualCaptions: boolean;
}

export interface DiagnosticsSettings {
  backendTarget: string;
  nativeCapabilityStatus: string;
  aiProvider: string;
  modelStatus: string;
  appVersion: string;
  demoMode: boolean;
}

export interface SettingsState {
  version: number;
  lastUpdated: string;
  aiAndModels: AIAndModelsSettings;
  wakeUp: WakeUpSettings;
  permissions: PermissionsSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  diagnostics: DiagnosticsSettings;
}
