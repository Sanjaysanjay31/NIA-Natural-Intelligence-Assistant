import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { CommitmentItem, CommitmentStatus } from './types';
import { CommitmentStatusBadge } from './CommitmentStatusBadge';
import { CommitmentSourceBadge } from './CommitmentSourceBadge';
import { CommitmentConfidence } from './CommitmentConfidence';

interface CommitmentDetailProps {
  commitment: CommitmentItem | null;
  visible: boolean;
  onClose: () => void;
  onUpdateStatus: (commitmentId: string, newStatus: CommitmentStatus) => Promise<void>;
  onLinkContext: (commitmentId: string, eventId?: string, location?: string) => Promise<void>;
  onDelete?: (commitmentId: string) => Promise<void>;
}

const ALL_STATUSES: CommitmentStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'AT_RISK',
];

export const CommitmentDetail: React.FC<CommitmentDetailProps> = ({
  commitment,
  visible,
  onClose,
  onUpdateStatus,
  onLinkContext,
  onDelete,
}) => {
  if (!commitment) return null;

  const [eventIdInput, setEventIdInput] = useState(commitment.relatedEventId || '');
  const [locationInput, setLocationInput] = useState(commitment.relatedLocation || '');
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusSelect = async (newStatus: CommitmentStatus) => {
    setIsSaving(true);
    try {
      await onUpdateStatus(commitment.id, newStatus);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinks = async () => {
    setIsSaving(true);
    try {
      await onLinkContext(commitment.id, eventIdInput.trim() || undefined, locationInput.trim() || undefined);
      setIsEditingLinks(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Top Bar */}
          <View style={styles.sheetHeader}>
            <View style={styles.badgeGroup}>
              <CommitmentStatusBadge status={commitment.status} />
              <CommitmentSourceBadge source={commitment.source} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close Modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title & Owner */}
            <Text style={styles.actionTitle}>{commitment.action}</Text>
            <View style={styles.ownerRow}>
              <Text style={styles.ownerLabel}>RESPONSIBLE OWNER:</Text>
              <Text style={styles.ownerValue}>{commitment.owner}</Text>
            </View>

            {/* Deadline */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>DEADLINE HORIZON</Text>
              <Text style={styles.deadlineValue}>
                {commitment.deadline ? `⏳ ${commitment.deadline}` : 'Open horizon (No explicit date specified)'}
              </Text>
            </View>

            {/* Evidence Replay Block */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>EVIDENCE PROVENANCE</Text>
              <View style={styles.evidenceBox}>
                <Text style={styles.evidenceQuote}>
                  "{commitment.evidence?.rawQuote || commitment.metadata?.raw_clause || commitment.action}"
                </Text>
                <View style={styles.evidenceMetaRow}>
                  <Text style={styles.evidenceMeta}>Ref: {commitment.evidenceRef || commitment.id}</Text>
                  <Text style={styles.evidenceMeta}>
                    Speaker: {commitment.evidence?.speaker || commitment.owner}
                  </Text>
                </View>
              </View>
            </View>

            {/* Confidence */}
            <View style={styles.section}>
              <CommitmentConfidence confidence={commitment.confidence} />
            </View>

            {/* Linked Context (Event & Location) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>REALITY CONTEXT LINKING</Text>
                {!isEditingLinks && (
                  <TouchableOpacity onPress={() => setIsEditingLinks(true)}>
                    <Text style={styles.editLinkText}>Edit Links</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditingLinks ? (
                <View style={styles.linkEditBox}>
                  <Text style={styles.inputLabel}>Calendar Event ID</Text>
                  <TextInput
                    style={styles.input}
                    value={eventIdInput}
                    onChangeText={setEventIdInput}
                    placeholder="e.g. evt-presentation-01"
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.inputLabel}>Physical Location</Text>
                  <TextInput
                    style={styles.input}
                    value={locationInput}
                    onChangeText={setLocationInput}
                    placeholder="e.g. Room 302"
                    placeholderTextColor={colors.text.muted}
                  />

                  <View style={styles.linkBtnRow}>
                    <TouchableOpacity
                      style={styles.saveLinkBtn}
                      onPress={handleSaveLinks}
                      disabled={isSaving}
                    >
                      <Text style={styles.saveLinkBtnText}>{isSaving ? 'Saving...' : 'Save Links'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelLinkBtn}
                      onPress={() => setIsEditingLinks(false)}
                    >
                      <Text style={styles.cancelLinkBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.contextPillContainer}>
                  <View style={styles.contextPill}>
                    <Text style={styles.contextPillIcon}>📅</Text>
                    <Text style={styles.contextPillText}>
                      {commitment.relatedEventId || 'No calendar event linked'}
                    </Text>
                  </View>
                  <View style={styles.contextPill}>
                    <Text style={styles.contextPillIcon}>📍</Text>
                    <Text style={styles.contextPillText}>
                      {commitment.relatedLocation || 'No location linked'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Status Transition Controls */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>LIFECYCLE STATUS TRANSITION</Text>
              <View style={styles.statusButtonGrid}>
                {ALL_STATUSES.map((st) => {
                  const isCurrent = commitment.status === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusSelectBtn,
                        isCurrent && styles.statusSelectBtnActive,
                      ]}
                      onPress={() => handleStatusSelect(st)}
                      disabled={isCurrent || isSaving}
                    >
                      <Text
                        style={[
                          styles.statusSelectBtnText,
                          isCurrent && styles.statusSelectBtnTextActive,
                        ]}
                      >
                        {st.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Delete button */}
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  onDelete(commitment.id);
                  onClose();
                }}
              >
                <Text style={styles.deleteBtnText}>Delete Commitment</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.border.elevated,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  actionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ownerLabel: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  ownerValue: {
    fontSize: 12,
    color: colors.primary.neonPurple,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  deadlineValue: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.cyan,
    fontWeight: '600',
  },
  evidenceBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.cyan,
  },
  evidenceQuote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  evidenceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  evidenceMeta: {
    fontSize: 10,
    color: colors.text.muted,
  },
  editLinkText: {
    fontSize: 11,
    color: colors.primary.cyan,
    fontWeight: 'bold',
  },
  contextPillContainer: {
    gap: spacing.xs,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    padding: spacing.xs,
    borderRadius: radii.sm,
    gap: spacing.xs,
  },
  contextPillIcon: {
    fontSize: 12,
  },
  contextPillText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  linkEditBox: {
    backgroundColor: colors.background.elevated,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  inputLabel: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  input: {
    backgroundColor: colors.background.base,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  linkBtnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  saveLinkBtn: {
    backgroundColor: colors.primary.cyan,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  saveLinkBtnText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cancelLinkBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  cancelLinkBtnText: {
    color: colors.text.muted,
    fontSize: 11,
  },
  statusButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusSelectBtn: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statusSelectBtnActive: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
  },
  statusSelectBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  statusSelectBtnTextActive: {
    color: colors.primary.cyan,
  },
  deleteBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.accent.dangerRed,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
});
