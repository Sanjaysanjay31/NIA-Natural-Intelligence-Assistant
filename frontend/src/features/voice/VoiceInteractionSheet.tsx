import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { voiceService } from './voiceService';
import { VoiceSessionState } from './types';

interface VoiceInteractionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceInteractionSheet: React.FC<VoiceInteractionSheetProps> = ({
  visible,
  onClose,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceSessionState>(voiceService.getState());
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const unsubscribe = voiceService.subscribe(setVoiceState);
    return unsubscribe;
  }, []);

  if (!visible) return null;

  const handleStartMic = () => {
    voiceService.startListening();
  };

  const handleSimulateTranscript = (phrase: string) => {
    voiceService.processInput(phrase);
  };

  const handleSubmitText = () => {
    if (typedText.trim()) {
      voiceService.processInput(typedText.trim());
      setTypedText('');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>VOICE & TEXT COMMAND INTERACTION</Text>
            <TouchableOpacity
              onPress={() => {
                voiceService.cancel();
                onClose();
              }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Permission Warning / Education if Mic Denied */}
          {!voiceState.micPermissionGranted && (
            <View style={styles.permWarning}>
              <Text style={styles.permTitle}>Microphone Permission Denied</Text>
              <Text style={styles.permBody}>
                Voice recognition is paused. You can use typed commands below with zero loss of functionality.
              </Text>
            </View>
          )}

          {/* Listening Indicator / Pulse State */}
          <View style={styles.indicatorContainer}>
            {voiceState.voiceState === 'LISTENING' ? (
              <View style={styles.listeningCircle}>
                <ActivityIndicator size="small" color="#00F0FF" />
                <Text style={styles.indicatorText}>Listening for voice commands...</Text>
              </View>
            ) : voiceState.voiceState === 'PROCESSING' ? (
              <View style={styles.processingCircle}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.indicatorText}>Routing query through IntentRouter...</Text>
              </View>
            ) : voiceState.voiceState === 'SPEAKING' ? (
              <View style={styles.speakingCircle}>
                <Text style={styles.speakingIcon}>🔊</Text>
                <Text style={styles.indicatorText}>System TTS Speaking Response...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.micButton} onPress={handleStartMic}>
                <Text style={styles.micIcon}>🎙</Text>
                <Text style={styles.micButtonText}>Tap to Speak</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Live Transcript / Result Preview */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>TRANSCRIPT / INTENT RECOGNITION</Text>
            <Text style={styles.transcriptText}>
              {voiceState.transcript
                ? `"${voiceState.transcript}"`
                : voiceState.interimTranscript || 'Awaiting spoken or typed instruction...'}
            </Text>
            {voiceState.recognizedIntent && (
              <View style={styles.intentBadge}>
                <Text style={styles.intentBadgeText}>
                  INTENT: {voiceState.recognizedIntent.intent} ({(voiceState.recognizedIntent.confidence * 100).toFixed(0)}%)
                </Text>
              </View>
            )}
          </View>

          {/* Quick Deterministic Query Buttons (Testing & Prototype Speed) */}
          <Text style={styles.quickLabel}>QUICK TEST QUERIES</Text>
          <View style={styles.quickQueryGrid}>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSimulateTranscript('Is my presentation information still correct?')}
            >
              <Text style={styles.quickChipText}>"Is presentation correct?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSimulateTranscript('What changed?')}
            >
              <Text style={styles.quickChipText}>"What changed?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSimulateTranscript('Why?')}
            >
              <Text style={styles.quickChipText}>"Why?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSimulateTranscript('Fix it.')}
            >
              <Text style={styles.quickChipText}>"Fix it."</Text>
            </TouchableOpacity>
          </View>

          {/* Text Input Fallback */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Or type command here..."
              placeholderTextColor="#64748B"
              value={typedText}
              onChangeText={setTypedText}
              onSubmitEditing={handleSubmitText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSubmitText}>
              <Text style={styles.sendBtnText}>Send</Text>
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
    backgroundColor: 'rgba(7, 8, 13, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0E111C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permWarning: {
    backgroundColor: '#7F1D1D25',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  permTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  permBody: {
    color: '#E2E8F0',
    fontSize: 11,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  micButton: {
    backgroundColor: '#0284C725',
    borderColor: '#0284C7',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micIcon: {
    fontSize: 18,
  },
  micButtonText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  listeningCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00F0FF15',
    borderColor: '#00F0FF',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  processingCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B15',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  speakingCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B98115',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  speakingIcon: {
    fontSize: 14,
  },
  indicatorText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptBox: {
    backgroundColor: '#07080D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  transcriptLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  transcriptText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontStyle: 'italic',
  },
  intentBadge: {
    backgroundColor: '#161A2B',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  intentBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  quickLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickQueryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickChip: {
    backgroundColor: '#161A2B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  quickChipText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#07080D',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sendBtn: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#07080D',
    fontSize: 13,
    fontWeight: '800',
  },
});
