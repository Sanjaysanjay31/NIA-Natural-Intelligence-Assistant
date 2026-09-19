import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAgent } from '../../state/agentContext';
import { AgentState, WakeUpSource } from '../../contracts/enums';
import { NIAOrb } from '../../components/NIAOrb';
import { AgentStateIndicator } from '../../components/AgentStateIndicator';
import { SafeActionGateModal } from '../actions/SafeActionGateModal';
import { CapabilityStatusCard } from '../../components/CapabilityStatusCard';
import { SettingsEntry } from '../../components/SettingsEntry';
import { TargetingModal } from '../../components/TargetingModal';
import { DriftResult } from '../../contracts/reality';

interface AgentScreenProps {
  onOpenSettings?: () => void;
  onOpenEvidenceReplay?: (drift: DriftResult) => void;
  onOpenTimeline?: () => void;
}

export const AgentScreen: React.FC<AgentScreenProps> = ({
  onOpenSettings,
  onOpenEvidenceReplay,
  onOpenTimeline = () => {},
}) => {
  const {
    state,
    statusMessage,
    activeDrift,
    activeAction,
    responseHierarchy,
    isLoading,
    error,
    sessionId,
    startVerification,
    approveAction,
    rejectAction,
    cancel,
    retry,
    replaySession,
    resetToIdle,
  } = useAgent();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [safeGateVisible, setSafeGateVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'details' | 'impact'>('response');

  const handleOrbPress = () => {
    if (state === AgentState.IDLE) {
      startVerification(WakeUpSource.ORB);
    } else if (state === AgentState.ERROR) {
      retry();
    } else if (state === AgentState.ACTION_PENDING) {
      setSafeGateVisible(true);
    } else {
      cancel();
    }
  };

  const handleFixIt = () => {
    setSafeGateVisible(true);
  };

  const handleApproveAction = async () => {
    setSafeGateVisible(false);
    await approveAction();
  };

  const handleRejectAction = async () => {
    setSafeGateVisible(false);
    await rejectAction();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.brandingGroup}>
            <Text style={styles.brandTitle}>NIA</Text>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>SESS: {sessionId.slice(-6)}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            {state !== AgentState.IDLE && (
              <TouchableOpacity style={styles.iconBtn} onPress={cancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={replaySession}>
              <Text style={styles.replayBtnText}>Replay</Text>
            </TouchableOpacity>
            <SettingsEntry onPress={() => setSettingsModalVisible(true)} />
          </View>
        </View>

        {/* Central Dynamic Orb */}
        <View style={styles.orbContainer}>
          <NIAOrb state={state} size={190} onPress={handleOrbPress} />
          <View style={styles.statusGroup}>
            <AgentStateIndicator state={state} customLabel={statusMessage} />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary.cyan}
                style={{ marginTop: 8 }}
              />
            )}
          </View>
        </View>

        {/* Error / Retry Bar */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Perception Anomaly: {error}</Text>
            <View style={styles.errorBtnGroup}>
              <TouchableOpacity style={styles.retryBtn} onPress={retry}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dismissBtn} onPress={resetToIdle}>
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Response Hierarchy (Strictly Follows Prompt 12) */}
        {responseHierarchy && state !== AgentState.IDLE && (
          <View style={styles.responseContainer}>
            {/* 1. Concise Answer */}
            <View style={styles.conciseAnswerBox}>
              <Text style={styles.conciseAnswerText}>
                "{responseHierarchy.conciseAnswer}"
              </Text>
            </View>

            {/* 2. Truth Status */}
            <View style={styles.truthStatusCard}>
              <Text style={styles.sectionHeader}>REALITY TRUTH STATUS</Text>
              <View style={styles.comparisonGrid}>
                <View style={styles.comparisonCol}>
                  <Text style={styles.colLabel}>Digital Ground Truth</Text>
                  <Text style={styles.digitalVal}>{responseHierarchy.truthStatus.digital}</Text>
                  <Text style={styles.sourceTag}>Source: Calendar</Text>
                </View>
                <View style={styles.vsDivider}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={styles.comparisonCol}>
                  <Text style={styles.colLabel}>Physical Observed</Text>
                  <Text style={styles.observedVal}>{responseHierarchy.truthStatus.observed}</Text>
                  <Text style={styles.sourceTag}>Source: Camera OCR</Text>
                </View>
              </View>
              <View style={styles.confidenceRow}>
                <Text style={styles.confLabel}>Confidence:</Text>
                <Text style={styles.confValue}>{responseHierarchy.truthStatus.confidence}</Text>
                <Text style={styles.agreementTag}>
                  {responseHierarchy.truthStatus.agreement ? 'AGREEMENT' : 'DRIFT DETECTED'}
                </Text>
              </View>
            </View>

            {/* 3. Evidence Preview */}
            {responseHierarchy.evidence && (
              <View style={styles.evidenceCard}>
                <View style={styles.evidenceHeader}>
                  <Text style={styles.sectionHeader}>PHYSICAL EVIDENCE</Text>
                  <Text style={styles.evidenceTime}>
                    {new Date(responseHierarchy.evidence.capturedAt).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.snippetText}>
                  "{responseHierarchy.evidence.snippet}"
                </Text>
                <Text style={styles.privacyTag}>
                  On-Device Processing (Privacy Verified)
                </Text>
              </View>
            )}

            {/* 4. Impact Summary */}
            <View style={styles.impactCard}>
              <Text style={styles.sectionHeader}>CONNECTED IMPACT</Text>
              <Text style={styles.impactSummaryText}>
                Affects {responseHierarchy.impact.length} active scheduled items
              </Text>
              {responseHierarchy.impact.map((item) => (
                <View key={item.impactId} style={styles.impactItemRow}>
                  <Text style={styles.impactBullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.impactTitle}>{item.description}</Text>
                    {item.suggestedRemediation && (
                      <Text style={styles.impactAction}>{item.suggestedRemediation}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 5. Four Contextual Action Buttons */}
            <View style={styles.actionButtonsGrid}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  if (activeDrift && onOpenEvidenceReplay) {
                    onOpenEvidenceReplay(activeDrift);
                  }
                }}
              >
                <Text style={styles.actionBtnSecText}>Why?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  setActiveTab('details');
                }}
              >
                <Text style={styles.actionBtnSecText}>What changed?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={onOpenTimeline}
              >
                <Text style={styles.actionBtnSecText}>What does this affect?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleFixIt}>
                <Text style={styles.actionBtnPriText}>Fix it</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Developer Trigger Capabilities (Prompt 11) */}
        <CapabilityStatusCard />
      </ScrollView>

      {/* Safe Action Gate Modal */}
      {activeAction && (
        <SafeActionGateModal
          visible={safeGateVisible}
          action={activeAction}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          onReviewEvidence={() => {
            setSafeGateVisible(false);
            if (activeDrift && onOpenEvidenceReplay) {
              onOpenEvidenceReplay(activeDrift);
            }
          }}
          onClose={() => setSafeGateVisible(false)}
        />
      )}

      {/* Targeting Configuration Modal */}
      <TargetingModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.primary.cyan,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sessionBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sessionBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#161A2B',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  replayBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '600',
  },
  orbContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  statusGroup: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  errorBanner: {
    backgroundColor: '#7F1D1D30',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 8,
  },
  errorBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismissBtnText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  responseContainer: {
    marginBottom: 16,
  },
  conciseAnswerBox: {
    backgroundColor: '#0E1322',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.cyan,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  conciseAnswerText: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  truthStatusCard: {
    backgroundColor: '#0E111C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  comparisonGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07080D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  comparisonCol: {
    flex: 1,
  },
  colLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  digitalVal: {
    color: '#93C5FD',
    fontSize: 16,
    fontWeight: '700',
  },
  observedVal: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
  },
  sourceTag: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  vsDivider: {
    paddingHorizontal: 8,
  },
  vsText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  confValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  agreementTag: {
    marginLeft: 'auto',
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceCard: {
    backgroundColor: '#0E111C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evidenceTime: {
    color: '#64748B',
    fontSize: 11,
  },
  snippetText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontStyle: 'italic',
    marginVertical: 6,
  },
  privacyTag: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  impactCard: {
    backgroundColor: '#0E111C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  impactSummaryText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  impactItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  impactBullet: {
    color: '#F59E0B',
    fontSize: 14,
  },
  impactTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  impactAction: {
    color: '#64748B',
    fontSize: 11,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#161A2B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  actionBtnSecText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    width: '100%',
    backgroundColor: '#00F0FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnPriText: {
    color: '#07080D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
