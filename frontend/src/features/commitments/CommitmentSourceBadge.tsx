import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';
import { CommitmentSource } from './types';

interface CommitmentSourceBadgeProps {
  source: CommitmentSource;
}

const SOURCE_CONFIG: Record<CommitmentSource, { label: string; icon: string }> = {
  VOICE_MEMO: { label: 'VOICE MEMO', icon: '🎙' },
  CONVERSATION: { label: 'CONVERSATION', icon: '💬' },
  MEETING_TRANSCRIPT: { label: 'MEETING', icon: '📋' },
  IMPORTED_TEXT: { label: 'IMPORTED', icon: '📄' },
  DEMO: { label: 'DEMO', icon: '🧪' },
};

export const CommitmentSourceBadge: React.FC<CommitmentSourceBadgeProps> = ({ source }) => {
  const config = SOURCE_CONFIG[source] || { label: source, icon: '•' };

  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: 3,
  },
  icon: {
    fontSize: 9,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text.secondary,
    letterSpacing: 0.4,
  },
});
