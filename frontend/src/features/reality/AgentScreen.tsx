import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAgent } from '../../state/agentContext';
import { AgentState, DriftType, RealityState } from '../../contracts/enums';
import { NIAOrb } from '../../components/NIAOrb';
import { AgentStateIndicator } from '../../components/AgentStateIndicator';
import { VoiceButton } from '../../components/VoiceButton';
import { TextInput } from '../../components/TextInput';
import { QuickActions } from '../../components/QuickActions';
import { EvidencePreviewCard } from '../../components/EvidencePreviewCard';
import { TimelinePreview } from '../../components/TimelinePreview';
import { SettingsEntry } from '../../components/SettingsEntry';
import { TargetingModal } from '../../components/TargetingModal';
import { resolveApiBaseUrl, getBackendTarget } from '../../config/targeting';
import { TimelineEvent } from '../../contracts/timeline';
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
  const { state, statusMessage, activeDrift, transitionTo, setActiveDrift, resetToIdle } = useAgent();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [mockTimeline] = useState<TimelineEvent[]>([
    {
      eventId: 'evt-101',
      timestamp: new Date().toISOString(),
      eventType: 'DRIFT_DETECTED' as any,
      title: 'Location Drift: Final Presentation',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1'],
      actor: 'veyra_x',
    },
    {
      eventId: 'evt-100',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      eventType: 'TRUTH_CONFIRMED' as any,
      title: 'Digital Ground Truth Synced',
      entity: 'Calendar Event',
      evidenceRefs: ['ev-cal-1'],
      actor: 'system',
    },
  ]);

  const handleOrbPress = () => {
    if (state === AgentState.IDLE) {
      transitionTo(AgentState.LISTENING, 'Listening for voice or environment signals...');
    } else if (state === AgentState.LISTENING) {
      transitionTo(AgentState.THINKING, 'Cross-referencing digital calendar against physical evidence...');
      setTimeout(() => {
        // Trigger hackathon scenario
        triggerHackathonDrift();
      }, 1200);
    } else if (state === AgentState.DRIFT) {
      if (activeDrift && onOpenEvidenceReplay) {
        onOpenEvidenceReplay(activeDrift);
      }
    } else {
      resetToIdle();
    }
  };

  const triggerHackathonDrift = () => {
    const demoDrift: DriftResult = {
      realityId: 'real-demo-1',
      entity: 'Final Presentation',
      digital: { location: 'Room 204', source: 'calendar', scheduledTime: '09:00 AM' },
      physical: { location: 'Room 302', source: 'ocr', observedAt: new Date().toISOString() },
      state: RealityState.REALITY_DRIFT,
      driftType: DriftType.LOCATION_CHANGED,
      confidence: 0.94,
      agreement: false,
      evidenceRefs: ['ev-calendar-1', 'ev-ocr-1'],
      impactRefs: ['reminder-1', 'alarm-1'],
      affectedEntities: ['Projector Reminder', 'Wake-up Alarm'],
      proposedActionRef: 'action-update-room-302',
      approvalRequired: true,
      explanation: 'Calendar says Room 204, but latest physical evidence says Room 302.',
      evaluatedAt: new Date().toISOString(),
    };
    setActiveDrift(demoDrift);
    transitionTo(AgentState.DRIFT, 'Contradiction Detected: Final Presentation moved to Room 302');
  };

  const quickActions = [
    {
      id: 'check-pres',
      label: 'Check Presentation',
      icon: '🎯',
      onPress: () => {
        transitionTo(AgentState.VERIFYING, 'Reading physical notice for Final Presentation...');
        setTimeout(triggerHackathonDrift, 800);
      },
    },
    {
      id: 'mind-pulse',
      label: 'Mind Pulse Scan',
      icon: '⚡',
      onPress: () => {
        transitionTo(AgentState.VERIFYING, 'Scanning situational pulse & live commitments...');
        setTimeout(() => {
          transitionTo(AgentState.VERIFIED, 'All other commitments aligned with physical reality.');
        }, 1200);
      },
    },
    {
      id: 'reset',
      label: 'Reset Layer',
      icon: '↺',
      onPress: resetToIdle,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top status & targeting bar */}
      <SettingsEntry
        backendTarget={getBackendTarget()}
        resolvedUrl={resolveApiBaseUrl()}
        onPress={() => {
          if (onOpenSettings) {
            onOpenSettings();
          } else {
            setSettingsModalVisible(true);
          }
        }}
      />

      {/* Main Title / Brand Tagline */}
      <View style={styles.titleContainer}>
        <Text style={styles.appTitle}>NIA</Text>
        <Text style={styles.appSubtitle}>Is what I know still true?</Text>
      </View>

      {/* Large Central NIA Orb */}
      <View style={styles.orbSection}>
        <NIAOrb state={state} onPress={handleOrbPress} onLongPress={resetToIdle} size={180} />
      </View>

      {/* State & Context Feedback Indicator */}
      <AgentStateIndicator state={state} statusMessage={statusMessage} />

      {/* Quick Action Navigation Pills */}
      <QuickActions actions={quickActions} />

      {/* Evidence Preview Card (when drift detected) */}
      {activeDrift && (
        <EvidencePreviewCard
          drift={activeDrift}
          onReviewEvidence={() => onOpenEvidenceReplay && onOpenEvidenceReplay(activeDrift)}
        />
      )}

      {/* Accessible Voice Trigger Button */}
      <VoiceButton
        isListening={state === AgentState.LISTENING}
        onPress={() => {
          if (state === AgentState.LISTENING) {
            handleOrbPress();
          } else {
            transitionTo(AgentState.LISTENING, 'Listening to user voice...');
          }
        }}
      />

      {/* Typed Query Bar */}
      <TextInput
        onSubmit={(text) => {
          transitionTo(AgentState.THINKING, `Evaluating query: "${text}"...`);
          setTimeout(triggerHackathonDrift, 1000);
        }}
      />

      {/* Recent Timeline Preview */}
      <TimelinePreview events={mockTimeline} onViewAll={onOpenTimeline} />

      {/* Backend Targeting Configuration Modal */}
      <TargetingModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  appTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary.cyan,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    minHeight: 220,
  },
});
