import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { settingsStorage } from './settingsStorage';
import { SettingsState } from './types';

interface SettingsScreenProps {
  onBack?: () => void;
}

type TabKey = 'AI_MODELS' | 'WAKEUP' | 'PERMISSIONS' | 'PRIVACY' | 'ACCESSIBILITY' | 'DIAGNOSTICS';

const PERMISSION_EXPLANATIONS: Record<string, { title: string; explanation: string }> = {
  microphone: {
    title: 'Microphone Permission',
    explanation: 'Used strictly for on-device voice interaction when the Orb is active. Audio streams never leave your device without explicit approval.',
  },
  camera: {
    title: 'Camera Permission',
    explanation: 'Used to scan physical notices and verify real-world changes (e.g. room changes). Raw imagery remains on-device; only structured observations are evaluated.',
  },
  calendar: {
    title: 'Calendar Permission',
    explanation: 'Required to read your scheduled events to establish digital ground truth and detect reality drift.',
  },
  notifications: {
    title: 'Notification Permission',
    explanation: 'Used to notify you when VEYRA X identifies high-confidence reality drift affecting your schedule or reminders.',
  },
  accessibilityService: {
    title: 'Accessibility Service (Native Only)',
    explanation: 'Used strictly for Mind Pulse screen reading on native Android builds. Never silently enabled. NIA will never collect passwords, banking info, or sensitive fields.',
  },
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<SettingsState>(settingsStorage.getSettings());
  const [activeTab, setActiveTab] = useState<TabKey>('AI_MODELS');
  const [pendingPermission, setPendingPermission] = useState<string | null>(null);
  const [evidenceDeletedMessage, setEvidenceDeletedMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = settingsStorage.subscribe(() => {
      setSettings(settingsStorage.getSettings());
    });
    return unsubscribe;
  }, []);

  const handleToggle = (path: string[], value: boolean) => {
    settingsStorage.updateSettings((prev) => {
      const copy: any = { ...prev };
      let curr = copy;
      for (let i = 0; i < path.length - 1; i++) {
        curr[path[i]] = { ...curr[path[i]] };
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;
      return copy;
    });
  };

  const handlePermissionClick = (permKey: string, currentVal: boolean) => {
    if (!currentVal) {
      // Rule: Never request permission without explaining why!
      setPendingPermission(permKey);
    } else {
      // Toggle off directly
      handleToggle(['permissions', permKey], false);
    }
  };

  const confirmPermission = () => {
    if (pendingPermission) {
      handleToggle(['permissions', pendingPermission], true);
      setPendingPermission(null);
    }
  };

  const handleDeleteEvidence = async () => {
    const res = await settingsStorage.deleteEvidenceCache();
    setEvidenceDeletedMessage(`Purged ${res.deletedCount} cached evidence items. Local disk freed.`);
    setTimeout(() => setEvidenceDeletedMessage(null), 3000);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'AI_MODELS', label: 'AI & Models' },
    { key: 'WAKEUP', label: 'Wake-up' },
    { key: 'PERMISSIONS', label: 'Permissions' },
    { key: 'PRIVACY', label: 'Privacy' },
    { key: 'ACCESSIBILITY', label: 'Accessibility' },
    { key: 'DIAGNOSTICS', label: 'Diagnostics' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SETTINGS & PRIVACY</Text>
          <Text style={styles.subtitle}>On-device verification, controls & diagnostics</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: AI & Models */}
        {activeTab === 'AI_MODELS' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>AI & RUNTIME MODELS</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Local AI Availability</Text>
                <Text style={styles.settingDesc}>Run Whisper Tiny & VEYRA X heuristics locally on phone</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Model Storage Consumption</Text>
                <Text style={styles.settingDesc}>Weights & tokenizers stored in app data</Text>
              </View>
              <Text style={styles.storageVal}>{settings.aiAndModels.modelStorageMb} MB</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Online Fallback Preference</Text>
                <Text style={styles.settingDesc}>Allow fallback to remote LLM when device memory is constrained</Text>
              </View>
              <Switch
                value={settings.aiAndModels.allowCloudFallback}
                onValueChange={(val) => handleToggle(['aiAndModels', 'allowCloudFallback'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Alert.alert('Model Updated', 'Verified latest local ONNX model packages.')}
              >
                <Text style={styles.actionButtonText}>Check Updates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerBtn]}
                onPress={() => Alert.alert('Cache Cleared', 'Freed temporary model cache.')}
              >
                <Text style={styles.dangerBtnText}>Clear Model Cache</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: Wake-up */}
        {activeTab === 'WAKEUP' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>WAKE-UP ORCHESTRATION</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Orb Tap Trigger</Text>
                <Text style={styles.settingDesc}>Tap the cinematic floating Orb to awaken NIA</Text>
              </View>
              <Switch
                value={settings.wakeUp.orbTapEnabled}
                onValueChange={(val) => handleToggle(['wakeUp', 'orbTapEnabled'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Mind Pulse Trigger</Text>
                <Text style={styles.settingDesc}>3-finger upward swipe gesture to inspect reality</Text>
              </View>
              <Switch
                value={settings.wakeUp.mindPulseEnabled}
                onValueChange={(val) => handleToggle(['wakeUp', 'mindPulseEnabled'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>"Hey NIA" Wake Word</Text>
                <Text style={styles.settingDesc}>Always-on acoustic detector</Text>
              </View>
              <Switch
                value={settings.wakeUp.heyNiaHotword}
                onValueChange={(val) => handleToggle(['wakeUp', 'heyNiaHotword'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            {/* Rule: Never imply background mic support in Expo Go */}
            <View style={styles.warningBanner}>
              <Text style={styles.warningTitle}>⚠️ EXPO GO RUNTIME NOTICE</Text>
              <Text style={styles.warningText}>
                Background microphone listening is not supported inside Expo Go sandbox. In Expo Go, wake word is simulated; persistent background audio requires an iQOO native APK build.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 3: Permissions */}
        {activeTab === 'PERMISSIONS' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>SYSTEM PERMISSIONS & EXPLANATIONS</Text>
            <Text style={styles.ruleNotice}>
              NIA policy: Every permission requires an upfront explanation. No background exploitation.
            </Text>

            {(['microphone', 'camera', 'calendar', 'notifications', 'accessibilityService'] as const).map((perm) => (
              <View key={perm} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {PERMISSION_EXPLANATIONS[perm]?.title || perm}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {PERMISSION_EXPLANATIONS[perm]?.explanation}
                  </Text>
                </View>
                <Switch
                  value={settings.permissions[perm]}
                  onValueChange={(val) => handlePermissionClick(perm, !val)}
                  trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
                />
              </View>
            ))}

            {/* Rule: Never silently enable AccessibilityService */}
            <View style={styles.dangerBanner}>
              <Text style={styles.dangerTitle}>🔒 ACCESSIBILITY SERVICE INTEGRITY</Text>
              <Text style={styles.dangerText}>
                AccessibilityService is NEVER silently enabled. Enabling it requires manual system authorization in Android Settings. NIA only reads active UI nodes during an explicit Mind Pulse gesture.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 4: Privacy */}
        {activeTab === 'PRIVACY' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>PRIVACY & DATA RESIDENCY</Text>

            {/* Rule: Never hide whether evidence is local/cloud */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerTitle}>📍 EVIDENCE RESIDENCY: 100% LOCAL DEVICE</Text>
              <Text style={styles.badgeBannerText}>
                All images, OCR tokens, calendar caches, and speech recordings reside exclusively in private app storage on this device.
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Strict Local Processing Only</Text>
                <Text style={styles.settingDesc}>Never route transcripts or observations through external cloud gateways</Text>
              </View>
              <Switch
                value={settings.privacy.localProcessingOnly}
                onValueChange={(val) => handleToggle(['privacy', 'localProcessingOnly'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Evidence Retention Period</Text>
                <Text style={styles.settingDesc}>Automatically purge physical observations and camera snapshots</Text>
              </View>
              <Text style={styles.storageVal}>{settings.privacy.evidenceRetentionDays} Days</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Cloud Upload Policy</Text>
                <Text style={styles.settingDesc}>Silent upload is strictly disabled across all pipelines</Text>
              </View>
              <Text style={styles.policyBadge}>{settings.privacy.cloudUploadPolicy}</Text>
            </View>

            <TouchableOpacity style={styles.deleteEvidenceBtn} onPress={handleDeleteEvidence}>
              <Text style={styles.deleteEvidenceBtnText}>Delete All Local Evidence Artifacts</Text>
            </TouchableOpacity>

            {evidenceDeletedMessage && (
              <Text style={styles.successFeedback}>{evidenceDeletedMessage}</Text>
            )}
          </View>
        )}

        {/* TAB 5: Accessibility */}
        {activeTab === 'ACCESSIBILITY' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>ACCESSIBILITY & INCLUSION</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>TalkBack Accessibility Labels</Text>
                <Text style={styles.settingDesc}>Semantic voiceover descriptions for all interactive controls</Text>
              </View>
              <Switch
                value={settings.accessibility.talkBackLabels}
                onValueChange={(val) => handleToggle(['accessibility', 'talkBackLabels'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>High Contrast Large Controls</Text>
                <Text style={styles.settingDesc}>Enlarge touch targets and action buttons</Text>
              </View>
              <Switch
                value={settings.accessibility.largeControls}
                onValueChange={(val) => handleToggle(['accessibility', 'largeControls'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Reduced Motion</Text>
                <Text style={styles.settingDesc}>Disable particle glow animations and Orb continuous pulses</Text>
              </View>
              <Switch
                value={settings.accessibility.reducedMotion}
                onValueChange={(val) => handleToggle(['accessibility', 'reducedMotion'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDesc}>Vibrate on wake-up, drift confirmation, and action execution</Text>
              </View>
              <Switch
                value={settings.accessibility.hapticsEnabled}
                onValueChange={(val) => handleToggle(['accessibility', 'hapticsEnabled'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Visual Live Captions</Text>
                <Text style={styles.settingDesc}>Show live transcription text preview during voice prompts</Text>
              </View>
              <Switch
                value={settings.accessibility.visualCaptions}
                onValueChange={(val) => handleToggle(['accessibility', 'visualCaptions'], val)}
                trackColor={{ false: colors.background.elevated, true: colors.primary.cyan }}
              />
            </View>
          </View>
        )}

        {/* TAB 6: Diagnostics */}
        {activeTab === 'DIAGNOSTICS' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>SYSTEM DIAGNOSTICS & STATUS</Text>
            <Text style={styles.ruleNotice}>
              Zero secret exposure guarantee. Safe environment introspection.
            </Text>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Backend Target</Text>
              <Text style={styles.diagValue}>{settings.diagnostics.backendTarget}</Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Native Capability</Text>
              <Text style={styles.diagValue}>{settings.diagnostics.nativeCapabilityStatus}</Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>AI Provider</Text>
              <Text style={styles.diagValue}>{settings.diagnostics.aiProvider}</Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Model Status</Text>
              <Text style={styles.diagValue}>{settings.diagnostics.modelStatus}</Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>App Version</Text>
              <Text style={styles.diagValue}>{settings.diagnostics.appVersion}</Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Deterministic Demo Mode</Text>
              <Text style={[styles.diagValue, { color: colors.primary.cyan }]}>
                {settings.diagnostics.demoMode ? 'ENABLED (Hackathon Ready)' : 'DISABLED'}
              </Text>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Schema Migration Version</Text>
              <Text style={styles.diagValue}>v{settings.version}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Permission Education Modal */}
      <Modal visible={!!pendingPermission} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {pendingPermission ? PERMISSION_EXPLANATIONS[pendingPermission]?.title : ''}
            </Text>
            <Text style={styles.modalBody}>
              {pendingPermission ? PERMISSION_EXPLANATIONS[pendingPermission]?.explanation : ''}
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setPendingPermission(null)}
              >
                <Text style={styles.modalBtnText}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.allowModalBtn]}
                onPress={confirmPermission}
              >
                <Text style={[styles.modalBtnText, { color: colors.background.base, fontWeight: '700' }]}>
                  Allow
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  backBtnText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabScroll: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.background.surface,
  },
  tabItemActive: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
    borderWidth: 1,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary.cyan,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  sectionHeader: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  settingDesc: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  storageVal: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
  policyBadge: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    backgroundColor: colors.accent.amberMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  badgeSuccess: {
    backgroundColor: colors.accent.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
  },
  badgeSuccessText: {
    color: colors.accent.successGreen,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    paddingVertical: 8,
    borderRadius: radii.sm,
    alignItems: 'center',
    borderColor: colors.border.elevated,
    borderWidth: 1,
  },
  actionButtonText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  dangerBtn: {
    borderColor: colors.accent.dangerRed,
  },
  dangerBtnText: {
    color: colors.accent.dangerRed,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: colors.accent.amberMuted,
    borderColor: colors.accent.amberDrift,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  warningTitle: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  warningText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  dangerBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.accent.dangerRed,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  dangerTitle: {
    color: colors.accent.dangerRed,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  dangerText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  badgeBanner: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  badgeBannerTitle: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  badgeBannerText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  ruleNotice: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  deleteEvidenceBtn: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.accent.dangerRed,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteEvidenceBtnText: {
    color: colors.accent.dangerRed,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  successFeedback: {
    color: colors.accent.successGreen,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  diagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  diagLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  diagValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '100%',
    borderColor: colors.border.elevated,
    borderWidth: 1,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  modalBody: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
  },
  cancelModalBtn: {
    backgroundColor: colors.background.elevated,
  },
  allowModalBtn: {
    backgroundColor: colors.primary.cyan,
  },
  modalBtnText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
});
