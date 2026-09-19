import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { ProposedAction } from '../../contracts/action';

interface SafeActionGateModalProps {
  visible: boolean;
  action: ProposedAction | null;
  onApprove: (action: ProposedAction) => void;
  onReject: (action: ProposedAction, reason: string) => void;
  onClose: () => void;
}

export const SafeActionGateModal: React.FC<SafeActionGateModalProps> = ({
  visible,
  action,
  onApprove,
  onReject,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!action) {
    return null;
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onApprove(action);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    onReject(action, 'Rejected by user from Safe Action Gate');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Safety Warning */}
          <View style={styles.safetyBanner}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <View>
              <Text style={styles.safetyTitle}>SAFE ACTION GATE</Text>
              <Text style={styles.safetySubtitle}>
                Explicit human verification required before mutating digital state
              </Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>

            {/* Before vs After State Comparison */}
            <View style={styles.diffBox}>
              <View style={styles.stateCol}>
                <Text style={styles.diffColHeader}>BEFORE STATE</Text>
                <Text style={styles.diffVal}>
                  {action.beforeState.location || JSON.stringify(action.beforeState)}
                </Text>
                <Text style={styles.diffSub}>Known Digital Ground Truth</Text>
              </View>

              <Text style={styles.arrow}>→</Text>

              <View style={styles.stateCol}>
                <Text style={[styles.diffColHeader, { color: colors.primary.cyan }]}>
                  TARGET STATE
                </Text>
                <Text style={[styles.diffVal, { color: colors.primary.cyan }]}>
                  {action.afterState.location || JSON.stringify(action.afterState)}
                </Text>
                <Text style={styles.diffSub}>Reality-Verified Target</Text>
              </View>
            </View>

            {/* Evidence References */}
            <View style={styles.evidenceRefsBox}>
              <Text style={styles.evidenceHeader}>EVIDENCE AUDIT PROVENANCE:</Text>
              {action.evidenceRefs.map((ref) => (
                <Text key={ref} style={styles.refText}>
                  • {ref}
                </Text>
              ))}
            </View>
          </ScrollView>

          {/* Decision Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={handleDismiss}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel="Reject proposed action"
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={handleConfirm}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel="Approve and execute action"
            >
              <Text style={styles.approveBtnText}>
                {isProcessing ? 'Executing...' : '✓ Approve & Update'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Review Later</Text>
          </TouchableOpacity>
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
  container: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.glowCyan,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  shieldIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  safetyTitle: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  safetySubtitle: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 1,
  },
  scrollArea: {
    marginBottom: spacing.md,
  },
  actionTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  diffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stateCol: {
    flex: 1,
    alignItems: 'center',
  },
  diffColHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text.muted,
    marginBottom: 4,
  },
  diffVal: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  diffSub: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 2,
  },
  arrow: {
    color: colors.primary.cyan,
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: spacing.sm,
  },
  evidenceRefsBox: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary.cyan,
  },
  evidenceHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text.muted,
    marginBottom: 4,
  },
  refText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.dangerRed,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: colors.accent.dangerRed,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.primary.cyan,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  approveBtnText: {
    color: colors.background.base,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  cancelBtnText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
  },
});
