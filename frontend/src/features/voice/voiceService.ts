import { VoiceSessionState, VoiceState, IntentRouteResult } from './types';
import { intentRouter } from './intentRouter';
import { agentSessionStore } from '../../state/agentSessionStore';
import { WakeUpSource } from '../../contracts/enums';
import { DemoTTSProvider } from '../localAi/providers/demoProvider';

export type VoiceListener = (state: VoiceSessionState) => void;

export class VoiceService {
  private state: VoiceSessionState = {
    voiceState: 'IDLE',
    transcript: '',
    interimTranscript: '',
    recognizedIntent: null,
    micPermissionGranted: true, // Default true for demo, toggleable
    isTtsSpeaking: false,
  };

  private ttsProvider = new DemoTTSProvider();
  private listeners: Set<VoiceListener> = new Set();

  subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  getState(): VoiceSessionState {
    return { ...this.state };
  }

  setMicPermission(granted: boolean) {
    this.state.micPermissionGranted = granted;
    this.notify();
  }

  /**
   * Start listening via microphone with permission education check.
   */
  async startListening(): Promise<void> {
    if (!this.state.micPermissionGranted) {
      this.state.voiceState = 'ERROR';
      this.state.error = 'MIC_PERMISSION_DENIED: Microphone access denied. Please use text input.';
      this.notify();
      return;
    }

    this.state.voiceState = 'LISTENING';
    this.state.transcript = '';
    this.state.interimTranscript = 'Listening...';
    this.state.recognizedIntent = null;
    this.state.error = undefined;
    this.notify();
  }

  /**
   * Universal input handler:
   * Both spoken transcripts and typed text enter here through the exact same IntentRouter.
   */
  async processInput(rawText: string): Promise<IntentRouteResult> {
    this.state.voiceState = 'PROCESSING';
    this.state.transcript = rawText;
    this.state.interimTranscript = '';
    this.notify();

    const result = intentRouter.route(rawText);
    this.state.recognizedIntent = result;
    this.notify();

    // Route Intent to NIA Orchestration
    await this.dispatchIntent(result);

    this.state.voiceState = 'IDLE';
    this.notify();
    return result;
  }

  private async dispatchIntent(result: IntentRouteResult) {
    switch (result.intent) {
      case 'VERIFY_INFORMATION':
        await agentSessionStore.runVerificationFlow(WakeUpSource.WAKE_WORD);
        break;

      case 'FIX_IT':
        await agentSessionStore.approveAndExecuteAction();
        break;

      case 'CANCEL':
        agentSessionStore.cancel();
        break;

      case 'WHY':
        await this.speak('Your presentation moved to Room 302 according to the physical notice.');
        break;

      case 'WHAT_CHANGED':
        await this.speak('Location changed from Room 204 to Room 302.');
        break;

      case 'WHAT_AFFECTS':
        await this.speak('This impacts your departure alarm, slide preparation reminder, and faculty meeting.');
        break;

      case 'NEXT_MEETING':
        await this.speak('Your next event is Final Presentation at 09:00 AM in Room 302.');
        break;

      case 'COMMITMENT_EXTRACT':
        // Bhupathi Extension Point
        await this.speak('Delegating commitment extraction to VoiceMemo module.');
        break;

      case 'HELP':
      default:
        await this.speak('You can ask: Is my presentation still correct, What changed, Why, or Fix it.');
        break;
    }
  }

  async speak(text: string): Promise<void> {
    this.state.isTtsSpeaking = true;
    this.state.voiceState = 'SPEAKING';
    this.notify();

    await this.ttsProvider.speak(text);

    this.state.isTtsSpeaking = false;
    this.state.voiceState = 'IDLE';
    this.notify();
  }

  stopListening() {
    this.state.voiceState = 'IDLE';
    this.state.interimTranscript = '';
    this.notify();
  }

  cancel() {
    this.state.voiceState = 'IDLE';
    this.state.transcript = '';
    this.state.interimTranscript = '';
    this.state.isTtsSpeaking = false;
    this.notify();
  }
}

export const voiceService = new VoiceService();
