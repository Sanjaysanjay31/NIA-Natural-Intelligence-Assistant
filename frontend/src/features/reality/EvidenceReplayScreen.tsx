import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { DriftResult } from '../../contracts/reality';
import { ImpactItem } from '../../contracts/impact';
import { ImpactGraphView } from './ImpactGraphView';
import { SafeActionGateModal } from '../actions/SafeActionGateModal';
import { ProposedAction } from '../../contracts/action';

interface EvidenceReplayScreenProps {
  drift: DriftResult;
  onBack: () => void;
  onActionApproved?: (action: ProposedAction) => void;
}

export const EvidenceReplayScreen: React.FC<EvidenceReplayScreenProps> = ({
  drift,
  onBack,
  onActionApproved,
}) => {
  const [activeTab, setActiveTab] = useState<'replay' | 'impact'>('replay');
  const [safeGateVisible, setSafeGateVisible] = useState<boolean>(false);
  const [mockImpacts] = useState<ImpactItem[]>([
    {
      impactId: 'imp-rem-01',
      targetType: 'reminder',
      targetId: 'rem-204',
      description: 'Projector equipment check scheduled for Room 204.',
      severity: 'HIGH' as any,
      suggestedRemediation: 'Update destination to Room 302',
    },
    {
      impactId: 'imp-alm-01',
      targetType: 'alarm',
      targetId: 'alm-0900',
      description: 'Travel buffer may need adjustment (+3 minutes to 3rd floor).',
      severity: 'MEDIUM' as any,
      suggestedRemediation: 'Advance alarm by 5 minutes',
    },
    {
      impactId: 'imp-cmt-01',
      targetType: 'commitment',
      targetId: 'cmt-sharma',
      description: 'Meeting Prof. Sharma outside room at 08:45.',
      severity: 'HIGH' as any,
      suggestedRemediation: 'Notify Prof. Sharma of room move to 302',
    },
  ]);

  const handleWhy = () => {
    Alert.alert(
      'Why is this a conflict?',
      drift.explanation ||
        'The physical sign explicitly relocates the presentation from Room 204 to Room 302.'
    );
  };

  const handleWhatChanged = () => {
    Alert.alert(
      'What changed?',
      `Location divergence detected:\n• Digital state: ${drift.digital.location}\n• Physical evidence: ${drift.physical.location}`
    );
  };

  const handleApproveAction = (action: ProposedAction) => {
    setSafeGateVisible(false);
    Alert.alert(
      'Safe Action Executed',
      `Successfully updated ${action.title}!\nCalendar updated to ${action.afterState.location}. Recorded on Reality Timeline.`
    );
    if (onActionApproved) {
      onActionApproved(action);
    }
  };

  const handleRejectAction = (_action: ProposedAction, reason: string) => {
    setSafeGateVisible(false);
    Alert.alert('Action Rejected', `Action was rejected: ${reason}`);
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>EVIDENCE REPLAY</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {Math.round(drift.confidence * 100)}% Match
          </Text>
        </View>
      </View>

      {/* Segment tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'replay' && styles.tabActive]}
          onPress={() => setActiveTab('replay')}
        >
          <Text
            style={[styles.tabText, activeTab === 'replay' && styles.tabTextActive]}
          >
            Evidence Replay (8 Proofs)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'impact' && styles.tabActive]}
          onPress={() => setActiveTab('impact')}
        >
          <Text
            style={[styles.tabText, activeTab === 'impact' && styles.tabTextActive]}
          >
            Impact Graph ({mockImpacts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {activeTab === 'replay' ? (
          <View>
            {/* The 8 Core Questions Card */}
            <View style={styles.proofCard}>
              <Text style={styles.proofHeader}>1. WHAT DID NIA KNOW?</Text>
              <Text style={styles.proofValue}>
                {drift.digital.location || 'Room 204'} (Scheduled 09:00 AM)
              </Text>
              <Text style={styles.proofMeta}>Source: Digital Google Calendar API</Text>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>2. WHAT WAS OBSERVED?</Text>
              <Text style={[styles.proofValue, { color: colors.accent.amberDrift }]}>
                {drift.physical.location || 'Room 302'}
              </Text>
              <Text style={styles.proofSnippet}>
                “Notice: Departmental Presentations moved to Room 302”
              </Text>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>3. WHEN WAS IT OBSERVED?</Text>
              <Text style={styles.proofValue}>
                {new Date(drift.evaluatedAt).toLocaleTimeString()} (Latest Physical Scan)
              </Text>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>4. FROM WHERE?</Text>
              <Text style={styles.proofValue}>
                Sensor: Camera OCR • Notice Board @ Hallway 2nd Floor
              </Text>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>5. WHAT CHANGED?</Text>
              <View style={styles.diffPill}>
                <Text style={styles.diffFrom}>{drift.digital.location}</Text>
                <Text style={styles.diffArrow}>→</Text>
                <Text style={styles.diffTo}>{drift.physical.location}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>6. WHY WAS IT CONSIDERED A CONFLICT?</Text>
              <Text style={styles.proofText}>
                {drift.explanation ||
                  'The detected room assignment directly contradicts the room in the active calendar appointment.'}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>7. WHAT CONFIDENCE EXISTS?</Text>
              <View style={styles.confidenceRow}>
                <View style={styles.meterTrack}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${Math.round(drift.confidence * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.meterLabel}>
                  {Math.round(drift.confidence * 100)}% Confidence
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.proofHeader}>8. WHAT ACTION WAS PROPOSED?</Text>
              <Text style={styles.proofAction}>
                {drift.proposedAction?.title ||
                  'Update Final Presentation location from Room 204 to Room 302'}
              </Text>
              <Text style={styles.gateNotice}>
                🛡️ Safe Action Gate: Requires explicit confirmation before mutation
              </Text>
            </View>

            {/* Evidence References */}
            <View style={styles.refsContainer}>
              <Text style={styles.refsTitle}>CRYPTOGRAPHIC EVIDENCE REFS:</Text>
              {drift.evidenceRefs.map((ref) => (
                <Text key={ref} style={styles.refItem}>
                  🔗 {ref}
                </Text>
              ))}
            </View>
          </View>
        ) : (
          <ImpactGraphView impacts={mockImpacts} entityName={drift.entity} />
        )}
      </ScrollView>

      {/* Bottom Action Toolbar */}
      <View style={styles.bottomBar}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.toolBtn} onPress={handleWhy}>
            <Text style={styles.toolBtnText}>Why?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleWhatChanged}>
            <Text style={styles.toolBtnText}>What changed?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setActiveTab('impact')}
          >
            <Text style={styles.toolBtnText}>Affects?</Text>
          </TouchableOpacity>

          {/* Fix It button triggers Safe Action Gate */}
          <TouchableOpacity
            style={styles.fixItBtn}
            onPress={() => setSafeGateVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Fix it through Safe Action Gate"
          >
            <Text style={styles.fixItBtnText}>Fix it →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safe Action Gate Modal */}
      <SafeActionGateModal
        visible={safeGateVisible}
        action={
          drift.proposedAction || {
            actionId: 'act-01',
            realityId: drift.realityId,
            title: 'Update Final Presentation Location',
            description: 'Change Room 204 to Room 302 across calendar and downstream reminders.',
            beforeState: { location: drift.digital.location },
            afterState: { location: drift.physical.location },
            approvalState: 'PENDING_APPROVAL' as any,
            approvalRequired: true,
            evidenceRefs: drift.evidenceRefs,
            createdAt: new Date().toISOString(),
          }
        }
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onClose={() => setSafeGateVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backBtnText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
  topBarTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  confidenceText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.cyan,
  },
  tabText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: colors.primary.cyan,
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
  },
  proofCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proofHeader: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  proofValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    marginTop: 2,
  },
  proofMeta: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  proofSnippet: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  diffFrom: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  diffArrow: {
    color: colors.accent.amberDrift,
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  diffTo: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  proofText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meterTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  meterFill: {
    height: '100%',
    backgroundColor: colors.primary.cyan,
  },
  meterLabel: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  proofAction: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gateNotice: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 4,
  },
  refsContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.xxl,
  },
  refsTitle: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  refItem: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    marginVertical: 1,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  toolBtnText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  fixItBtn: {
    flex: 1.5,
    backgroundColor: colors.primary.cyan,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  fixItBtnText: {
    color: colors.background.base,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
});
