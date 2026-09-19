import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { useVoiceMemo } from './useVoiceMemo';
import { RecordingIndicator } from './RecordingIndicator';
import { TranscriptPreview } from './TranscriptPreview';
import { CommitmentExtractionPreview } from './CommitmentExtractionPreview';
import { VoiceMemoErrorState } from './VoiceMemoErrorState';
import { ExtractedCommitmentItem } from './types';

interface VoiceMemoRecorderProps {
  onCommitmentSaved?: (commitment: ExtractedCommitmentItem) => void;
  defaultDemoMode?: boolean;
}

export const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  onCommitmentSaved,
  defaultDemoMode = true,
}) => {
  const {
    state,
    duration,
    transcript,
    commitments,
    errorMessage,
    isDemoMode,
    setIsDemoMode,
    startRecording,
    stopRecording,
    processExtraction,
    saveCommitment,
    discard,
  } = useVoiceMemo(defaultDemoMode);

  const handleSave = async (commitment: ExtractedCommitmentItem) => {
    await saveCommitment(commitment);
    if (onCommitmentSaved) {
      onCommitmentSaved(commitment);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Mode Switch */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>VoiceMemo Pro</Text>
          <Text style={styles.subtitle}>Spoken Utterance → Structured Commitment</Text>
        </View>
        <TouchableOpacity
          style={[styles.demoToggle, isDemoMode && styles.demoToggleActive]}
          onPress={() => setIsDemoMode(!isDemoMode)}
          accessibilityRole="button"
          accessibilityLabel="Toggle Demo Mode"
        >
          <Text style={[styles.demoToggleText, isDemoMode && styles.demoToggleTextActive]}>
            {isDemoMode ? 'DEMO FIXTURE ON' : 'LIVE MIC'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* State 1: Error */}
      {state === 'error' && errorMessage && (
        <VoiceMemoErrorState
          errorMessage={errorMessage}
          onRetry={() => transcript && processExtraction(transcript)}
          onDismiss={discard}
        />
      )}

      {/* State 2: Idle */}
      {state === 'idle' && (
        <View style={styles.idleBox}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
            accessibilityRole="button"
            accessibilityLabel="Start Voice Memo Recording"
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
          <Text style={styles.instructionText}>Tap red circle to begin speaking</Text>
          <Text style={styles.captionText}>
            Deterministic on-device extraction guarantees privacy.
          </Text>
        </View>
      )}

      {/* State 3: Recording */}
      {state === 'recording' && (
        <View style={styles.recordingBox}>
          <RecordingIndicator durationSeconds={duration} isRecording={true} />
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => stopRecording()}
            accessibilityRole="button"
            accessibilityLabel="Stop Recording"
          >
            <View style={styles.stopSquare} />
            <Text style={styles.stopButtonText}>Stop & Extract</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* State 4: Processing */}
      {state === 'processing' && (
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={colors.primary.cyan} />
          <Text style={styles.processingTitle}>Extracting Commitments...</Text>
          <Text style={styles.processingSubtitle}>
            Parsing conversational intent, owners, and temporal deadlines.
          </Text>
        </View>
      )}

      {/* State 5: Extracted Results */}
      {state === 'extracted' && (
        <View style={styles.resultsBox}>
          <TranscriptPreview transcript={transcript} />
          <CommitmentExtractionPreview
            commitments={commitments}
            onSave={handleSave}
            onDiscard={discard}
          />
        </View>
      )}

      {/* State 6: Saved Confirmation */}
      {state === 'saved' && (
        <View style={styles.savedBox}>
          <Text style={styles.savedIcon}>✓</Text>
          <Text style={styles.savedTitle}>Commitment Saved to NIA Ground Truth</Text>
          <Text style={styles.savedSubtitle}>
            Ready to link with calendar events, locations, and Reality Graph.
          </Text>
          <TouchableOpacity
            style={styles.newMemoBtn}
            onPress={discard}
            accessibilityRole="button"
            accessibilityLabel="Record Another Memo"
          >
            <Text style={styles.newMemoBtnText}>Record Another Memo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
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
  demoToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  demoToggleActive: {
    backgroundColor: colors.primary.cyanMuted,
    borderColor: colors.primary.cyan,
  },
  demoToggleText: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: 'bold',
  },
  demoToggleTextActive: {
    color: colors.primary.cyan,
  },
  idleBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: colors.accent.dangerRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  recordButtonInner: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.accent.dangerRed,
  },
  instructionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  captionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  recordingBox: {
    alignItems: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.dangerRed,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: colors.text.primary,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  stopButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
  processingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  processingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  processingSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  resultsBox: {},
  savedBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  savedIcon: {
    fontSize: 40,
    color: colors.accent.successGreen,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  savedTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  savedSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  newMemoBtn: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.focus,
  },
  newMemoBtnText: {
    color: colors.primary.cyan,
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
  },
});
