import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { CommitmentItem, CommitmentStatus } from './types';
import { CommitmentCard } from './CommitmentCard';
import { CommitmentDetail } from './CommitmentDetail';
import { CommitmentEmptyState } from './CommitmentEmptyState';
import { useCommitments } from './useCommitments';

interface CommitmentListProps {
  onRecordNew?: () => void;
}

const FILTER_TABS: { label: string; status?: CommitmentStatus }[] = [
  { label: 'ALL' },
  { label: 'PENDING', status: 'PENDING' },
  { label: 'IN PROGRESS', status: 'IN_PROGRESS' },
  { label: 'AT RISK', status: 'AT_RISK' },
  { label: 'COMPLETED', status: 'COMPLETED' },
];

export const CommitmentList: React.FC<CommitmentListProps> = ({ onRecordNew }) => {
  const {
    commitments,
    isLoading,
    error,
    filters,
    setFilters,
    fetchCommitments,
    updateStatus,
    linkContext,
    markCompleted,
    deleteCommitment,
  } = useCommitments();

  const [selectedCommitment, setSelectedCommitment] = useState<CommitmentItem | null>(null);

  const handleTabPress = (status?: CommitmentStatus) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Refresh */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Commitments</Text>
          <Text style={styles.subtitle}>Extracted conversational promises & deadlines</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchCommitments}
          accessibilityRole="button"
          accessibilityLabel="Refresh Commitments"
        >
          <Text style={styles.refreshBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabScroll}>
        {FILTER_TABS.map((tab) => {
          const isActive = filters.status === tab.status;
          return (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabPress(tab.status)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={fetchCommitments} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary.cyan} />
          <Text style={styles.loadingText}>Loading commitments...</Text>
        </View>
      ) : commitments.length === 0 ? (
        <CommitmentEmptyState
          title={filters.status ? `No ${filters.status.replace('_', ' ')} Commitments` : 'No Commitments Found'}
          description="Capture a new voice memo or speak an utterance to populate commitments."
          actionLabel={onRecordNew ? 'Record Voice Memo' : undefined}
          onAction={onRecordNew}
        />
      ) : (
        <FlatList
          data={commitments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommitmentCard
              commitment={item}
              onOpenDetail={(cmt) => setSelectedCommitment(cmt)}
              onMarkCompleted={markCompleted}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail & Transition Modal */}
      <CommitmentDetail
        commitment={selectedCommitment}
        visible={selectedCommitment !== null}
        onClose={() => setSelectedCommitment(null)}
        onUpdateStatus={async (id, newStatus) => {
          await updateStatus(id, newStatus);
          setSelectedCommitment((prev) => (prev ? { ...prev, status: newStatus } : null));
        }}
        onLinkContext={async (id, eventId, location) => {
          await linkContext(id, eventId, location);
          setSelectedCommitment((prev) =>
            prev ? { ...prev, relatedEventId: eventId, relatedLocation: location } : null
          );
        }}
        onDelete={async (id) => {
          await deleteCommitment(id);
          setSelectedCommitment(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  refreshBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  refreshBtnText: {
    fontSize: 11,
    color: colors.primary.cyan,
    fontWeight: '600',
  },
  tabScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tabActive: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.primary.cyan,
  },
  errorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent.dangerRed,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.dangerRed,
    flex: 1,
  },
  retryBtn: {
    marginLeft: spacing.sm,
  },
  retryBtnText: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
});
