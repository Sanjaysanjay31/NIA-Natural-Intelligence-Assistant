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
import { TimelineEvent } from '../../contracts/timeline';
import { TimelineEventType } from '../../contracts/enums';

interface RealityTimelineScreenProps {
  onBack: () => void;
}

export const RealityTimelineScreen: React.FC<RealityTimelineScreenProps> = ({
  onBack,
}) => {
  const [events] = useState<TimelineEvent[]>([
    {
      eventId: 'evt-07',
      timestamp: '2026-09-19T09:15:20Z',
      eventType: TimelineEventType.ACTION_EXECUTED,
      title: 'Action Executed: Calendar Relocated to Room 302',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1'],
      actor: 'user',
      details: { updatedField: 'location', old: 'Room 204', new: 'Room 302' },
    },
    {
      eventId: 'evt-06',
      timestamp: '2026-09-19T09:15:18Z',
      eventType: TimelineEventType.ACTION_APPROVED,
      title: 'Safe Action Gate: Approval Granted',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1'],
      actor: 'user',
      details: { method: 'biometric_tap' },
    },
    {
      eventId: 'evt-05',
      timestamp: '2026-09-19T09:15:03Z',
      eventType: TimelineEventType.ACTION_PROPOSED,
      title: 'Proposed Action Generated: Relocate Presentation',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1', 'ev-cal-1'],
      actor: 'veyra_x',
      details: { target: 'Room 302', approvalRequired: true },
    },
    {
      eventId: 'evt-04',
      timestamp: '2026-09-19T09:15:02Z',
      eventType: TimelineEventType.DRIFT_DETECTED,
      title: 'Reality Drift Detected: LOCATION_CHANGED',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1', 'ev-cal-1'],
      actor: 'veyra_x',
      details: { confidence: 0.94, delta: 'Room 204 -> Room 302' },
    },
    {
      eventId: 'evt-03',
      timestamp: '2026-09-19T09:15:00Z',
      eventType: TimelineEventType.OBSERVATION_INGESTED,
      title: 'Physical Observation Captured via Camera OCR',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-ocr-1'],
      actor: 'system',
      details: { rawText: 'Notice: Presentations moved to Room 302' },
    },
    {
      eventId: 'evt-01',
      timestamp: '2026-09-19T08:00:00Z',
      eventType: TimelineEventType.TRUTH_CONFIRMED,
      title: 'Digital Ground Truth Synced from Google Calendar',
      entity: 'Final Presentation',
      evidenceRefs: ['ev-cal-1'],
      actor: 'system',
      details: { location: 'Room 204', time: '09:00 AM' },
    },
  ]);

  const handleExportAudit = () => {
    Alert.alert(
      'Reality Audit Exported',
      'Reality Audit report generated with full cryptographic evidence references.'
    );
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case TimelineEventType.ACTION_EXECUTED:
        return '✓';
      case TimelineEventType.ACTION_APPROVED:
        return '🛡️';
      case TimelineEventType.ACTION_PROPOSED:
        return '📋';
      case TimelineEventType.DRIFT_DETECTED:
        return '⚡';
      case TimelineEventType.OBSERVATION_INGESTED:
        return '👁️';
      case TimelineEventType.TRUTH_CONFIRMED:
        return '📅';
      default:
        return '•';
    }
  };

  const getEventColor = (type: TimelineEventType) => {
    switch (type) {
      case TimelineEventType.ACTION_EXECUTED:
      case TimelineEventType.TRUTH_CONFIRMED:
        return colors.accent.successGreen;
      case TimelineEventType.DRIFT_DETECTED:
        return colors.accent.amberDrift;
      case TimelineEventType.ACTION_PROPOSED:
      case TimelineEventType.ACTION_APPROVED:
        return colors.primary.cyan;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>REALITY TIMELINE</Text>
        <TouchableOpacity onPress={handleExportAudit} style={styles.exportBtn}>
          <Text style={styles.exportText}>Export 📄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.sectionTitle}>CHRONOLOGICAL REALITY AUDIT</Text>
        <Text style={styles.sectionSubtitle}>
          Immutable log of observations, drift detections, and approved actions
        </Text>

        {events.map((evt, index) => {
          const isLast = index === events.length - 1;
          const icon = getEventIcon(evt.eventType);
          const color = getEventColor(evt.eventType);

          return (
            <View key={evt.eventId} style={styles.eventRow}>
              {/* Timeline spine */}
              <View style={styles.spine}>
                <View style={[styles.iconCircle, { borderColor: color }]}>
                  <Text style={styles.iconText}>{icon}</Text>
                </View>
                {!isLast && <View style={styles.spineLine} />}
              </View>

              {/* Event Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.eventType, { color }]}>
                    {evt.eventType.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.timeText}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </Text>
                </View>

                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.actorText}>Actor: {evt.actor.toUpperCase()}</Text>

                {evt.details && Object.keys(evt.details).length > 0 && (
                  <View style={styles.detailsBox}>
                    {Object.entries(evt.details).map(([k, v]) => (
                      <Text key={k} style={styles.detailItem}>
                        • {k}: {String(v)}
                      </Text>
                    ))}
                  </View>
                )}

                {evt.evidenceRefs.length > 0 && (
                  <View style={styles.refsRow}>
                    {evt.evidenceRefs.map((ref) => (
                      <Text key={ref} style={styles.refTag}>
                        🔗 {ref}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  exportBtn: {
    padding: spacing.xs,
  },
  exportText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  eventRow: {
    flexDirection: 'row',
  },
  spine: {
    width: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconText: {
    fontSize: 10,
    color: colors.text.primary,
  },
  spineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: 2,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.sm,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: 10,
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actorText: {
    color: colors.text.muted,
    fontSize: 10,
    marginBottom: 6,
  },
  detailsBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.sm,
    padding: 6,
    marginBottom: 6,
  },
  detailItem: {
    color: colors.text.secondary,
    fontSize: 11,
    fontFamily: typography.fontFamily.mono,
  },
  refsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  refTag: {
    color: colors.primary.cyan,
    fontSize: 9,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
});
