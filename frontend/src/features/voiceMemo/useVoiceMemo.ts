import { useState, useRef, useEffect, useCallback } from 'react';
import { config } from '../../config/env';
import {
  VoiceMemoState,
  VoiceMemoSession,
  ExtractedCommitmentItem,
} from './types';

const DEMO_TRANSCRIPTS = [
  'I will submit the presentation slides by Friday.',
  'Sanjay will send the updated architecture diagrams tomorrow at 5 PM.',
  'I will review the pull request and finish the deployment checklist before Monday.',
];

export function useVoiceMemo(initialDemoMode: boolean = false) {
  const [state, setState] = useState<VoiceMemoState>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [commitments, setCommitments] = useState<ExtractedCommitmentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(initialDemoMode);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const demoIndexRef = useRef<number>(0);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    setErrorMessage(null);
    setDuration(0);
    setTranscript('');
    setCommitments([]);
    setState('recording');

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(async (customTranscript?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState('stopped');

    // Determine transcript text
    let activeTranscript = customTranscript;
    if (!activeTranscript && isDemoMode) {
      activeTranscript = DEMO_TRANSCRIPTS[demoIndexRef.current % DEMO_TRANSCRIPTS.length];
      demoIndexRef.current += 1;
    } else if (!activeTranscript) {
      // Default placeholder if recorded on device without active STT provider
      activeTranscript = 'I will prepare the presentation slides by Friday.';
    }

    setTranscript(activeTranscript);

    // Automatically trigger extraction pipeline
    await processExtraction(activeTranscript);
  }, [isDemoMode]);

  const processExtraction = useCallback(async (textToExtract: string) => {
    if (!textToExtract || textToExtract.trim().length === 0) {
      setState('error');
      setErrorMessage('No speech or transcript was detected to extract commitments.');
      return;
    }

    setState('processing');

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/commitments/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToExtract,
          source: 'VOICE_MEMO',
          currentUserName: 'current_user',
        }),
      });

      if (!response.ok) {
        throw new Error(`Extraction service returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const extracted: ExtractedCommitmentItem[] = (data.commitments || []).map((c: any) => ({
        id: c.id,
        owner: c.owner,
        action: c.action,
        deadline: c.deadline,
        confidence: c.confidence,
        status: c.status,
        source: c.source,
        relatedEventId: c.relatedEventId,
        relatedLocation: c.relatedLocation,
        evidenceRef: c.evidenceRef,
      }));

      setCommitments(extracted);
      setState('extracted');
    } catch (err: any) {
      setState('error');
      setErrorMessage(err.message || 'Failed to extract commitments from transcript.');
    }
  }, []);

  const saveCommitment = useCallback(async (commitment: ExtractedCommitmentItem) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commitment),
      });

      if (!response.ok && response.status !== 409) {
        throw new Error(`Save failed with HTTP ${response.status}`);
      }

      setState('saved');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save commitment.');
    }
  }, []);

  const discard = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState('idle');
    setDuration(0);
    setTranscript('');
    setCommitments([]);
    setErrorMessage(null);
  }, []);

  const session: VoiceMemoSession = {
    sessionId: `memo-${Date.now()}`,
    durationSeconds: duration,
    transcript: transcript || undefined,
    commitments,
    errorMessage: errorMessage || undefined,
    isDemoMode,
  };

  return {
    state,
    duration,
    transcript,
    commitments,
    errorMessage,
    isDemoMode,
    setIsDemoMode,
    session,
    startRecording,
    stopRecording,
    processExtraction,
    saveCommitment,
    discard,
  };
}
