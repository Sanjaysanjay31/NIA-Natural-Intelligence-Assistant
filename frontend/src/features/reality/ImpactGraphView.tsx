import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { ImpactItem } from '../../contracts/impact';

interface ImpactGraphViewProps {
  impacts: ImpactItem[];
  entityName?: string;
}

export const ImpactGraphView: React.FC<ImpactGraphViewProps> = ({
  impacts,
  entityName = 'Final Presentation',
}) => {
  if (!impacts || impacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No downstream dependencies affected.</Text>
      </View>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return colors.accent.amberDrift;
      case 'MEDIUM':
        return colors.primary.electricBlue;
      default:
        return colors.text.muted;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>IMPACT DEPENDENCY GRAPH</Text>
      <Text style={styles.headerSubtitle}>
        Downstream artifacts affected by reality drift in {entityName}
      </Text>

      {/* Root node */}
      <View style={styles.rootNode}>
        <Text style={styles.rootIcon}>⚡</Text>
        <Text style={styles.rootLabel}>{entityName} (Location Drift)</Text>
      </View>

      {/* Dependency branch lines & cards */}
      <View style={styles.chainContainer}>
        {impacts.map((item, index) => {
          const isLast = index === impacts.length - 1;
          const sevColor = getSeverityColor(item.severity);

          return (
            <View key={item.impactId} style={styles.itemWrapper}>
              {/* Connector line */}
              <View style={styles.connectorColumn}>
                <View style={[styles.dot, { backgroundColor: sevColor }]} />
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Card */}
              <View style={[styles.card, { borderLeftColor: sevColor }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.targetType}>{item.targetType.toUpperCase()}</Text>
                  <View style={[styles.badge, { backgroundColor: `${sevColor}22` }]}>
                    <Text style={[styles.badgeText, { color: sevColor }]}>
                      {item.severity}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description}>{item.description}</Text>

                {item.suggestedRemediation && (
                  <View style={styles.remediationBox}>
                    <Text style={styles.remediationLabel}>Remediation:</Text>
                    <Text style={styles.remediationText}>
                      {item.suggestedRemediation}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  rootNode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.border.glowAmber,
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  rootIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  rootLabel: {
    color: colors.accent.amberDrift,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  chainContainer: {
    paddingLeft: spacing.xs,
  },
  itemWrapper: {
    flexDirection: 'row',
  },
  connectorColumn: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 14,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.border.subtle,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  targetType: {
    color: colors.primary.cyan,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  description: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  remediationBox: {
    marginTop: 6,
    backgroundColor: colors.background.elevated,
    padding: 6,
    borderRadius: radii.sm,
  },
  remediationLabel: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  remediationText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
});
