import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { AccessibilityEducationManager } from './screenCaptureAdapters';

interface AccessibilityPermissionModalProps {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export const AccessibilityPermissionModal: React.FC<AccessibilityPermissionModalProps> = ({
  visible,
  onEnable,
  onDismiss,
}) => {
  const content = AccessibilityEducationManager.getEducationContent();

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRIVACY FIRST SCREEN INTELLIGENCE</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHAT NIA READS</Text>
            <Text style={styles.sectionBody}>{content.whatIsRead}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOW IT IS USED</Text>
            <Text style={styles.sectionBody}>{content.howItIsUsed}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR PRIVACY GUARANTEE</Text>
            <Text style={[styles.sectionBody, { color: colors.accent.successGreen }]}>
              {content.privacyGuarantee}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.enableBtn} onPress={onEnable}>
              <Text style={styles.enableText}>Enable Mind Pulse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 13, 0.88)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#0E111C',
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  badge: {
    backgroundColor: '#0284C720',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeText: {
    color: colors.primary.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionBody: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  dismissText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  enableBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary.cyan,
    alignItems: 'center',
  },
  enableText: {
    color: '#07080D',
    fontSize: 13,
    fontWeight: '800',
  },
});
