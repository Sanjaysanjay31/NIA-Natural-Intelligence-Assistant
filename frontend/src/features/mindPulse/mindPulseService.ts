import {
  MindPulseState,
  MindPulseOutcome,
  IScreenCaptureAdapter,
} from './types';
import { SimulatedScreenCaptureAdapter } from './screenCaptureAdapters';
import { MindPulseExtractor } from './mindPulseExtractor';
import { digitalStateProvider } from '../../adapters/calendar/digitalStateProvider';

export type MindPulseListener = (state: MindPulseState, outcome: MindPulseOutcome | null) => void;

export class MindPulseService {
  private state: MindPulseState = 'IDLE';
  private outcome: MindPulseOutcome | null = null;
  private adapter: IScreenCaptureAdapter;
  private listeners: Set<MindPulseListener> = new Set();
  private isCancelled: boolean = false;

  constructor(adapter?: IScreenCaptureAdapter) {
    this.adapter = adapter || new SimulatedScreenCaptureAdapter();
  }

  setAdapter(adapter: IScreenCaptureAdapter) {
    this.adapter = adapter;
  }

  getAdapter(): IScreenCaptureAdapter {
    return this.adapter;
  }

  getState(): MindPulseState {
    return this.state;
  }

  getOutcome(): MindPulseOutcome | null {
    return this.outcome;
  }

  subscribe(listener: MindPulseListener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.outcome);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: MindPulseState) {
    this.state = newState;
    this.listeners.forEach((fn) => fn(this.state, this.outcome));
  }

  /**
   * Complete Mind Pulse Verification Workflow:
   * 3-finger swipe up -> pulse -> capture screen -> extract info -> compare -> result
   */
  async triggerPulse(): Promise<MindPulseOutcome | null> {
    this.isCancelled = false;
    this.outcome = null;

    try {
      // 1. "Mind Pulse"
      this.setState('PULSING');
      await this.sleep(350);
      if (this.isCancelled) return null;

      // 2. "Reading current screen…"
      this.setState('CAPTURING');
      const captureResult = await this.adapter.captureCurrentScreen();
      await this.sleep(350);
      if (this.isCancelled) return null;

      // 3. "Extracting context…"
      this.setState('EXTRACTING');
      const extracted = MindPulseExtractor.extract(
        captureResult.rawText,
        captureResult.confidence
      );
      await this.sleep(350);
      if (this.isCancelled) return null;

      // 4. "Reality check complete" (Compare with digital ground truth)
      this.setState('CHECKING');
      const digitalEvent = await digitalStateProvider.getEventById('evt-final-presentation');
      const digitalLoc = digitalEvent?.location || 'Room 204';
      const digitalTime = '09:00 AM';

      // Comparison logic (Deterministic rules - NO LLM DEPENDENCY)
      const observedLoc = extracted.locations.length > 0 ? extracted.locations[0] : undefined;
      const isCancellation = extracted.rawText.toLowerCase().includes('postpone') || extracted.rawText.toLowerCase().includes('cancel');

      let status: 'VERIFIED' | 'DRIFT' | 'NEEDS_REVIEW' = 'VERIFIED';
      let headline = 'Ground Truth Verified';
      let summary = 'Screen content matches your synchronized schedule.';
      let requiresReview = false;

      if (extracted.confidence < 0.60 || (!observedLoc && !isCancellation)) {
        // Low confidence: Never invent certainty!
        status = 'NEEDS_REVIEW';
        headline = 'Uncertain Screen Content — Needs Review';
        summary = 'Text on screen was partially obscured or ambiguous. Review manually.';
        requiresReview = true;
      } else if (isCancellation) {
        status = 'DRIFT';
        headline = 'Schedule Drift: Event Postponed / Cancelled';
        summary = 'Screen notification indicates the presentation has been postponed.';
      } else if (observedLoc && observedLoc.toLowerCase().trim() !== digitalLoc.toLowerCase().trim()) {
        status = 'DRIFT';
        headline = `Location Drift: ${digitalLoc} → ${observedLoc}`;
        summary = `Screen mentions ${observedLoc}, but your digital calendar still says ${digitalLoc}.`;
      } else {
        status = 'VERIFIED';
        headline = 'Schedule Verified True';
        summary = `Screen confirms ${digitalEvent?.title || 'Presentation'} at ${digitalLoc} (${digitalTime}).`;
      }

      this.outcome = {
        status,
        headline,
        summary,
        digitalState: {
          entity: digitalEvent?.title || 'Final Presentation',
          location: digitalLoc,
          scheduledTime: digitalTime,
          source: 'calendar',
        },
        screenObserved: {
          location: observedLoc,
          sourceApp: captureResult.sourceApp,
        },
        confidence: extracted.confidence,
        extracted,
        requiresReview,
      };

      await this.sleep(350);
      if (this.isCancelled) return null;

      // 5. RESULT state
      this.setState('RESULT');
      return this.outcome;
    } catch (err: any) {
      this.setState('ERROR');
      return null;
    }
  }

  cancel() {
    this.isCancelled = true;
    this.state = 'IDLE';
    this.outcome = null;
    this.listeners.forEach((fn) => fn(this.state, null));
  }

  reset() {
    this.state = 'IDLE';
    this.outcome = null;
    this.listeners.forEach((fn) => fn(this.state, null));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mindPulseService = new MindPulseService();
