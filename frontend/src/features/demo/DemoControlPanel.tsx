import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/tokens';
import { demoController } from './demoController';
import { DemoScenarioState } from './types';

interface DemoControlPanelProps {
  onOpenAuditExport?: () => void;
  onOpenSettings?: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  onOpenAuditExport,
  onOpenSettings,
}) => {
  const [state, setState] = useState<DemoScenarioState>(demoController.getState());

  useEffect(() => {
    const unsubscribe = demoController.subscribe(() => {
      setState(demoController.getState());
    });
    return unsubscribe;
  }, []);

  const handleFixIt = () => {
    demoController.jumpToStep(12); // Jump to Safe Gate approval prompt
  };

  const handleApprove = () => {
    demoController.jumpToStep(14); // Executes update -> moves to success
  };

  const handleShareAudit = async () => {
    if (onOpenAuditExport) {
      onOpenAuditExport();
      return;
    }
    await Share.share({
      title: 'NIA Reality Audit Export',
      message: `NIA REALITY AUDIT EXPORT\nSession: ${state.sessionId}\nDrift: Room 204 -> Room 302\nApproved: YES\nState: SUCCEEDED`,
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Banner: Developer / Hackathon HUD */}
      <View style={styles.topHud}>
        <View style={styles.stepInfo}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP {state.step} / {state.totalSteps}</Text>
          </View>
          <Text style={styles.stepTitle} numberOfLines={1}>
            {state.title}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.debugToggle, state.debugMode && styles.debugToggleActive]}
          onPress={() => demoController.toggleDebugMode()}
        >
          <Text style={styles.debugToggleText}>
            {state.debugMode ? '🛠 DEV HUD' : '👤 USER UI'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Developer Controls Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => demoController.reset()}>
          <Text style={styles.controlBtnText}>⏮ Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => demoController.stepBackward()}>
          <Text style={styles.controlBtnText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, state.isAutoPlaying && styles.controlBtnActive]}
          onPress={() => demoController.toggleAutoPlay()}
        >
          <Text style={[styles.controlBtnText, state.isAutoPlaying && { color: colors.primary.cyan }]}>
            {state.isAutoPlaying ? '⏸ Pause' : '⚡ Auto'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => demoController.stepForward()}>
          <Text style={styles.controlBtnText}>Next ▶</Text>
        </TouchableOpacity>
      </View>

      {/* Step Direct Jump Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsScroller}
      >
        {Array.from({ length: 17 }, (_, i) => i + 1).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.stepPill, state.step === s && styles.stepPillActive]}
            onPress={() => demoController.jumpToStep(s)}
          >
            <Text style={[styles.stepPillText, state.step === s && styles.stepPillTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Natural Experience Surface */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agent State Banner */}
        <View style={styles.agentStateCard}>
          <View style={styles.stateIndicatorRow}>
            <View style={[styles.statusDot, { backgroundColor: getOrbColor(state.agentState) }]} />
            <Text style={styles.agentStateText}>AGENT STATE: {state.agentState}</Text>
          </View>
          <Text style={styles.stepDescription}>{state.description}</Text>
        </View>

        {/* User Query Balloon if step >= 4 */}
        {state.userQuery && (
          <View style={styles.userQueryBubble}>
            <Text style={styles.bubbleSender}>USER (VOICE / TEXT)</Text>
            <Text style={styles.bubbleText}>“{state.userQuery}”</Text>
          </View>
        )}

        {/* Ground Truth vs Physical Observation */}
        <View style={styles.contrastGrid}>
          {/* Digital Ground Truth */}
          <View style={styles.contrastCol}>
            <Text style={styles.contrastHeader}>DIGITAL KNOWN</Text>
            <Text style={styles.contrastSub}>Google Calendar</Text>
            <Text style={styles.locationVal}>{state.digitalState.location}</Text>
            <Text style={styles.metaVal}>{state.digitalState.title} • {state.digitalState.time}</Text>
          </View>

          {/* Physical Observation */}
          <View style={[styles.contrastCol, state.drift.detected && styles.contrastColDrift]}>
            <Text style={[styles.contrastHeader, state.drift.detected && { color: colors.accent.amberDrift }]}>
              PHYSICAL NOTICE
            </Text>
            <Text style={styles.contrastSub}>
              {state.physicalObservation.source || 'Waiting for scan...'}
            </Text>
            <Text style={[styles.locationVal, state.drift.detected && { color: colors.accent.amberDrift }]}>
              {state.physicalObservation.extractedLocation || '—'}
            </Text>
            <Text style={styles.metaVal} numberOfLines={2}>
              {state.physicalObservation.rawText || 'No physical notice scanned yet'}
            </Text>
          </View>
        </View>

        {/* VEYRA X Reality Drift Badge */}
        {state.drift.detected && (
          <View style={styles.driftBanner}>
            <View style={styles.driftBadge}>
              <Text style={styles.driftBadgeText}>⚠️ VEYRA X REALITY DRIFT DETECTED</Text>
            </View>
            <Text style={styles.driftDetails}>
              {state.drift.driftType}: {state.drift.before} ➔ {state.drift.current}
            </Text>
            <Text style={styles.driftConf}>Confidence: {(state.drift.confidence * 100).toFixed(0)}% (Deterministic)</Text>
          </View>
        )}

        {/* Impact Cascade */}
        {state.impactItems.length > 0 && (
          <View style={styles.impactCard}>
            <Text style={styles.cardHeader}>REALITY IMPACT CASCADE</Text>
            {state.impactItems.map((item) => (
              <View key={item.id} style={styles.impactItem}>
                <View style={styles.impactLeft}>
                  <Text style={styles.impactName}>{item.name}</Text>
                  <Text style={styles.impactDesc}>{item.impactDescription}</Text>
                </View>
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>{item.severity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Safe Action Gate */}
        {state.action.proposed && (
          <View style={styles.actionCard}>
            <Text style={styles.cardHeader}>SAFE ACTION GATE</Text>
            <Text style={styles.actionPrompt}>
              {state.action.description}
            </Text>

            <View style={styles.actionStatusRow}>
              <Text style={styles.actionStatusLabel}>
                Approval: <Text style={styles.actionStatusVal}>{state.action.approvalState}</Text>
              </Text>
              <Text style={styles.actionStatusLabel}>
                Execution: <Text style={styles.actionStatusVal}>{state.action.executionState}</Text>
              </Text>
            </View>

            {state.action.approvalState === 'PENDING' && (
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveBtn]}
                  onPress={handleApprove}
                >
                  <Text style={styles.approveBtnText}>✓ Approve Update</Text>
                </TouchableOpacity>
              </View>
            )}

            {state.action.approvalState === 'NONE' && (
              <TouchableOpacity style={styles.fixItBtn} onPress={handleFixIt}>
                <Text style={styles.fixItBtnText}>Fix It</Text>
              </TouchableOpacity>
            )}

            {state.action.executionState === 'SUCCEEDED' && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>✓ REMINDER & CALENDAR UPDATED TO ROOM 302</Text>
              </View>
            )}
          </View>
        )}

        {/* Step 16 & 17: Timeline & Reality Audit */}
        {state.auditExported && (
          <View style={styles.exportCard}>
            <Text style={styles.cardHeader}>OFFICE KIT REALITY AUDIT</Text>
            <Text style={styles.exportDesc}>
              Full 10-section audit generated with digital/physical evidence, before/after drift history, and user approval record.
            </Text>
            <TouchableOpacity style={styles.exportBtn} onPress={handleShareAudit}>
              <Text style={styles.exportBtnText}>📄 Export Reality Audit Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

function getOrbColor(agentState: string): string {
  switch (agentState) {
    case 'VERIFYING':
    case 'PROCESSING':
      return colors.primary.neonPurple;
    case 'DRIFT_DETECTED':
    case 'PROPOSING_ACTION':
    case 'AWAITING_APPROVAL':
      return colors.accent.amberDrift;
    case 'SUCCESS':
      return colors.accent.successGreen;
    default:
      return colors.primary.cyan;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  stepInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  stepBadge: {
    backgroundColor: colors.primary.cyanMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  stepBadgeText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
  debugToggle: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderColor: colors.border.elevated,
    borderWidth: 1,
  },
  debugToggleActive: {
    borderColor: colors.primary.cyan,
  },
  debugToggleText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  controlsBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    paddingVertical: 6,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
    borderWidth: 1,
  },
  controlBtnText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  stepsScroller: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: colors.background.surface,
  },
  stepPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: colors.primary.cyan,
  },
  stepPillText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  stepPillTextActive: {
    color: colors.background.base,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  agentStateCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  stateIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  agentStateText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  stepDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  userQueryBubble: {
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: radii.md,
    borderColor: colors.primary.cyanMuted,
    borderWidth: 1,
  },
  bubbleSender: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bubbleText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontStyle: 'italic',
  },
  contrastGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contrastCol: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  contrastColDrift: {
    borderColor: colors.accent.amberDrift,
    backgroundColor: colors.accent.amberMuted,
  },
  contrastHeader: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contrastSub: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  locationVal: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaVal: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  driftBanner: {
    backgroundColor: colors.accent.amberMuted,
    borderColor: colors.accent.amberDrift,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  driftBadge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  driftBadgeText: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  driftDetails: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  driftConf: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  impactCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  cardHeader: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  impactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  impactLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  impactName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  impactDesc: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  severityBadge: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  severityText: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  actionCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.border.elevated,
    borderWidth: 1,
  },
  actionPrompt: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  actionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionStatusLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  actionStatusVal: {
    color: colors.primary.cyan,
    fontWeight: 'bold',
  },
  fixItBtn: {
    backgroundColor: colors.primary.cyan,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  fixItBtnText: {
    color: colors.background.base,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.accent.successGreen,
  },
  approveBtnText: {
    color: colors.background.base,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
  successBanner: {
    backgroundColor: colors.accent.successMuted,
    borderColor: colors.accent.successGreen,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  successBannerText: {
    color: colors.accent.successGreen,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  exportCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderColor: colors.primary.cyan,
    borderWidth: 1,
  },
  exportDesc: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  exportBtn: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  exportBtnText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
