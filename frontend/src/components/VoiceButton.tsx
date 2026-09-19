import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

interface VoiceButtonProps {
  onPress: () => void;
  isListening?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  isListening = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop Listening' : 'Speak to NIA'}
      accessibilityHint="Activates voice perception mode"
      style={[
        styles.button,
        isListening ? styles.buttonActive : styles.buttonIdle,
      ]}
    >
      <Text style={styles.icon}>{isListening ? '⏹' : '🎙'}</Text>
      <Text style={styles.text}>
        {isListening ? 'Listening...' : '“Hey NIA” / Tap to Speak'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    minHeight: 56, // Large touch target
    marginVertical: spacing.sm,
  },
  buttonIdle: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.subtle,
  },
  buttonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: colors.primary.electricBlue,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm,
    color: colors.primary.cyan,
  },
  text: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
