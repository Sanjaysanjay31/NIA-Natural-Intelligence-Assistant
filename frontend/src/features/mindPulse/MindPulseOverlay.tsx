import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { mindPulseService } from './mindPulseService';
import { MindPulseState, MindPulseOutcome } from './types';

export const MindPulseOverlay: React.FC = () => {
  const [pulseState, setPulseState] = useState<MindPulseState>('IDLE');
  const [outcome, setOutcome] = useState<MindPulseOutcome | null>(null);

  useEffect(() => {
    const unsubscribe = mindPulseService.subscribe((state, out) => {
      setPulseState(state);
      setOutcome(out);
    });
    return unsubscribe;
  }, []);

  if (pulseState === 'IDLE') {
    return null;
  }

  const getStatusLabel = () => {
    switch (pulseState) {
      case 'PULSING':
        return 'Mind Pulse';
      case 'CAPTURING':
        return 'Reading current screen…';
      case 'EXTRACTING':
        return 'Extracting context…';
      case 'CHECKING':
        return 'Reality check complete';
      case 'RESULT':
        return outcome?.headline || 'Reality Verified';
      case 'ERROR':
        return 'Perception Anomaly';
      default:
        return 'Mind Pulse Active';
    }
  };

  const handleClose = () => {
    mindPulseService.reset();
  };

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.contentCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.radarIndicator}>
              <View style={styles.radarCore} />
            </View>
            <Text style={styles.headerTitle}>MIND PULSE RADAR</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress / Transition State */}
          <View style={styles.statusBox}>
            {pulseState !== 'RESULT' && pulseState !== 'ERROR' && (
              <ActivityIndicator
                size="small"
                color={colors.primary.cyan}
                style={{ marginBottom: 10 }}
              />
            )}
            <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
          </View>

          {/* Result Card when Complete */}
          {pulseState === 'RESULT' && outcome && (
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              {/* Conflict / Verification Card */}
              <View
                style={[
                  styles.outcomeBanner,
                  outcome.status === 'DRIFT' && styles.bannerDrift,
                  outcome.status === 'VERIFIED' && styles.bannerVerified,
                  outcome.status === 'NEEDS_REVIEW' && styles.bannerReview,
                ]}
              >
                <Text
                  style={[
                    styles.outcomeTitle,
                    outcome.status === 'DRIFT' && { color: '#F59E0B' },
                    outcome.status === 'VERIFIED' && { color: '#10B981' },
                    outcome.status === 'NEEDS_REVIEW' && { color: '#F97316' },
                  ]}
                >
                  {outcome.status === 'DRIFT'
                    ? '⚡ REALITY DRIFT DETECTED'
                    : outcome.status === 'VERIFIED'
                    ? '✓ GROUND TRUTH VERIFIED'
                    : '⚠ NEEDS MANUAL REVIEW'}
                </Text>
                <Text style={styles.outcomeSummary}>{outcome.summary}</Text>
              </View>

              {/* Truth Comparison */}
              <View style={styles.comparisonBox}>
                <View style={styles.col}>
                  <Text style={styles.colTitle}>Digital Calendar</Text>
                  <Text style={styles.colValue}>{outcome.digitalState.location || 'None'}</Text>
                  <Text style={styles.colTime}>{outcome.digitalState.scheduledTime}</Text>
                </View>
                <Text style={styles.vs}>VS</Text>
                <View style={styles.col}>
                  <Text style={styles.colTitle}>Visible Screen</Text>
                  <Text style={styles.colValueObs}>{outcome.screenObserved.location || 'Uncertain'}</Text>
                  <Text style={styles.colTime}>{outcome.screenObserved.sourceApp}</Text>
                </View>
              </View>

              {/* Extracted Context Items */}
              <View style={styles.entitiesBox}>
                <Text style={styles.sectionHeader}>EXTRACTED FROM SCREEN</Text>
                {outcome.extracted.events.length > 0 && (
                  <Text style={styles.entityRow}>
                    <Text style={styles.entityKey}>Events: </Text>
                    {outcome.extracted.events.join(', ')}
                  </Text>
                )}
                {outcome.extracted.locations.length > 0 && (
                  <Text style={styles.entityRow}>
                    <Text style={styles.entityKey}>Locations: </Text>
                    {outcome.extracted.locations.join(', ')}
                  </Text>
                )}
                {outcome.extracted.tasks.length > 0 && (
                  <Text style={styles.entityRow}>
                    <Text style={styles.entityKey}>Tasks: </Text>
                    {outcome.extracted.tasks.join('; ')}
                  </Text>
                )}
                {outcome.extracted.people.length > 0 && (
                  <Text style={styles.entityRow}>
                    <Text style={styles.entityKey}>People: </Text>
                    {outcome.extracted.people.join(', ')}
                  </Text>
                )}
                {outcome.extracted.deadlines.length > 0 && (
                  <Text style={styles.entityRow}>
                    <Text style={styles.entityKey}>Deadlines: </Text>
                    {outcome.extracted.deadlines.join(', ')}
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 13, 0.85)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  contentCard: {
    backgroundColor: '#0E111C',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#00F0FF40',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radarIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00F0FF30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radarCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
  },
  headerTitle: {
    color: colors.primary.cyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLabel: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultScroll: {
    marginTop: 10,
  },
  outcomeBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerDrift: {
    backgroundColor: '#F59E0B15',
    borderColor: '#F59E0B',
  },
  bannerVerified: {
    backgroundColor: '#10B98115',
    borderColor: '#10B981',
  },
  bannerReview: {
    backgroundColor: '#F9731615',
    borderColor: '#F97316',
  },
  outcomeTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  outcomeSummary: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 18,
  },
  comparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07080D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  col: {
    flex: 1,
  },
  colTitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 2,
  },
  colValue: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '700',
  },
  colValueObs: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  colTime: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  vs: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  entitiesBox: {
    backgroundColor: '#07080D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  entityRow: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 4,
  },
  entityKey: {
    color: '#00F0FF',
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
});
