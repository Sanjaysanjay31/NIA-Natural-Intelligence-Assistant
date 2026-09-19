import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme/tokens';

interface TextInputProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder = 'Ask NIA or enter reality query...',
  onSubmit,
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : styles.containerBlurred,
      ]}
    >
      <RNTextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={setValue}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        accessibilityLabel="Reality query text input"
      />
      {value.trim().length > 0 && (
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          accessibilityLabel="Submit query"
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginVertical: spacing.xs,
  },
  containerBlurred: {
    borderColor: colors.border.subtle,
  },
  containerFocused: {
    borderColor: colors.border.focus,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  sendText: {
    color: colors.primary.cyan,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
