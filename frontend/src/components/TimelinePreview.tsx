import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { TimelineEvent } from '../contracts/timeline';

interface TimelinePreviewProps {
  events: TimelineEvent[];
  onViewAll?: () => void;
}

export const TimelinePreview: React.FC<TimelinePreviewProps> = ({
  events,
  onViewAll,
}) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REALITY TIMELINE</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>Full Audit →</Text>
          </TouchableOpacity>
        )}
      </View>

      {events.slice(0, 3).map((event) => (
        <View key={event.eventId} style={styles.eventRow}>
          <View style={styles.dot} />
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSub}>
              {event.actor.toUpperCase()} • {new Date(event.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.text.muted,
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.cyan,
    fontWeight: '600',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.cyan,
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  eventSub: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
});
