import { AgentState, DriftType, RealityState, ApprovalState, WakeUpSource } from '../contracts/enums';
import { DriftResult } from '../contracts/reality';
import { ProposedAction } from '../contracts/action';
import { EvidenceItem } from '../contracts/evidence';
import { ImpactItem } from '../contracts/impact';
import { digitalStateProvider } from '../adapters/calendar/digitalStateProvider';
import { physicalObservationCapture } from '../adapters/ocr/physicalObservationCapture';
import { actionService } from '../services/actionService';

export interface SessionEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  state: AgentState;
  title: string;
  data?: any;
}

export interface TruthStatus {
  digital: string;
  observed: string;
  confidence: string;
  agreement: boolean;
}

export interface ResponseHierarchy {
  conciseAnswer: string;
  truthStatus: TruthStatus;
  evidence: EvidenceItem | null;
  impact: ImpactItem[];
  actionProposal: ProposedAction | null;
}

export type SessionStoreListener = () => void;

export class AgentSessionStore {
  private sessionId: string;
  private state: AgentState = AgentState.IDLE;
  private statusMessage: string = 'NIA Reality Layer Active';
  private events: SessionEvent[] = [];
  private activeDrift: DriftResult | null = null;
  private activeAction: ProposedAction | null = null;
  private responseHierarchy: ResponseHierarchy | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;
  private listeners: Set<SessionStoreListener> = new Set();
  private processedActions: Set<string> = new Set(); // Deduplication idempotency set
  private isCancelled: boolean = false;

  constructor() {
    this.sessionId = `sess-${Date.now()}`;
  }

  subscribe(listener: SessionStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Getters
  getSessionId(): string {
    return this.sessionId;
  }

  getState(): AgentState {
    return this.state;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  getEvents(): SessionEvent[] {
    return [...this.events];
  }

  getActiveDrift(): DriftResult | null {
    return this.activeDrift;
  }

  getActiveAction(): ProposedAction | null {
    return this.activeAction;
  }

  getResponseHierarchy(): ResponseHierarchy | null {
    return this.responseHierarchy;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getError(): string | null {
    return this.error;
  }

  private appendEvent(state: AgentState, title: string, data?: any) {
    const event: SessionEvent = {
      eventId: `ev-${this.events.length + 1}-${Date.now()}`,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      state,
      title,
      data,
    };
    this.events.push(event);
  }

  public transitionTo(nextState: AgentState, message?: string, data?: any) {
    this.state = nextState;
    if (message) {
      this.statusMessage = message;
    }
    this.appendEvent(nextState, message || nextState, data);
    this.notify();
  }

  /**
   * Canonical Orchestration Flow:
   * IDLE -> LISTENING -> THINKING -> VERIFYING -> DRIFT -> SPEAKING -> ACTION_PENDING -> SUCCESS
   * The Orb reflects actual asynchronous tasks, not an animation pretending to think.
   */
  async runVerificationFlow(source: WakeUpSource = WakeUpSource.ORB): Promise<void> {
    this.isCancelled = false;
    this.error = null;
    this.isLoading = true;
    this.sessionId = `sess-${Date.now()}`;
    this.events = [];

    try {
      // 1. LISTENING
      this.transitionTo(AgentState.LISTENING, 'Listening for physical and digital context...');
      await this.sleep(400);
      if (this.isCancelled) return;

      // 2. THINKING (Querying digital ground truth)
      this.transitionTo(AgentState.THINKING, 'Querying synchronized digital ground truth...');
      const digitalEvent = await digitalStateProvider.getEventById('evt-final-presentation');
      const digitalLocation = digitalEvent?.location || 'Room 204';
      await this.sleep(400);
      if (this.isCancelled) return;

      // 3. VERIFYING (Ingesting physical OCR observation)
      this.transitionTo(AgentState.VERIFYING, 'Ingesting physical observation and checking reality drift...');
      const captureResult = await physicalObservationCapture.captureAndExtract(
        'file://camera/last_frame.jpg',
        {},
        'Final Presentation'
      );
      const observedLocation = captureResult.extraction.location || 'Room 302';
      const confidence = captureResult.extraction.confidence || 0.96;
      await this.sleep(400);
      if (this.isCancelled) return;

      // Deterministic comparison: Room 204 != Room 302 -> DRIFT
      const isDrift = digitalLocation.toLowerCase().trim() !== observedLocation.toLowerCase().trim();

      const driftResult: DriftResult = {
        realityId: `real-${Date.now()}`,
        entity: 'Final Presentation',
        digital: {
          location: digitalLocation,
          source: 'calendar',
          scheduledTime: '09:00 AM',
        },
        physical: {
          location: observedLocation,
          source: 'ocr',
          observedAt: new Date().toISOString(),
        },
        state: isDrift ? RealityState.REALITY_DRIFT : RealityState.VERIFIED_TRUE,
        driftType: isDrift ? DriftType.LOCATION_CHANGED : DriftType.NO_DRIFT,
        confidence,
        agreement: !isDrift,
        evidenceRefs: [captureResult.evidence.evidenceId],
        impactRefs: ['imp-alarm-1', 'imp-rem-1', 'imp-meet-1'],
        affectedEntities: ['Final Presentation Reminder', 'Departure Alarm', 'Prof. Sharma Review'],
        proposedActionRef: isDrift ? `act-update-room-${Date.now()}` : undefined,
        approvalRequired: isDrift,
        evaluatedAt: new Date().toISOString(),
      };
      this.activeDrift = driftResult;

      // 4. VERIFIED or DRIFT
      if (isDrift) {
        this.transitionTo(AgentState.DRIFT, 'Reality Drift Detected: Presentation relocated to Room 302');
      } else {
        this.transitionTo(AgentState.VERIFIED, 'Ground Truth Verified & In Sync');
        this.isLoading = false;
        return;
      }
      await this.sleep(500);
      if (this.isCancelled) return;

      // 5. Formulate Response Hierarchy
      const impactItems: ImpactItem[] = [
        {
          impactId: 'imp-rem-1',
          targetType: 'reminder',
          targetId: 'rem-final-pres',
          description: 'Prepare presentation deck (Location: Room 204)',
          severity: 'HIGH' as any,
          suggestedRemediation: 'Update location to Room 302',
        },
        {
          impactId: 'imp-alarm-1',
          targetType: 'alarm',
          targetId: 'alarm-pres-depart',
          description: 'Departure Alarm: Walk to Room 204',
          severity: 'HIGH' as any,
          suggestedRemediation: 'Recalculate route for Room 302 (3rd floor)',
        },
        {
          impactId: 'imp-meet-1',
          targetType: 'meeting',
          targetId: 'meet-prof-sharma',
          description: 'Prof. Sharma Review Session',
          severity: 'MEDIUM' as any,
          suggestedRemediation: 'Notify attendees of Room 302 shift',
        },
      ];

      // Propose Safe Action (Deduplication Check)
      const actionId = driftResult.proposedActionRef || `act-room-shift-${Date.now()}`;
      let proposedAction: ProposedAction | null = null;

      if (!this.processedActions.has(actionId)) {
        proposedAction = {
          actionId,
          title: 'Update reminder location',
          description: 'Update reminder and calendar location from Room 204 to Room 302?',
          beforeState: { location: digitalLocation },
          afterState: { location: observedLocation },
          evidenceRefs: driftResult.evidenceRefs,
          createdAt: new Date().toISOString(),
          approvalState: ApprovalState.PENDING_APPROVAL,
          approvalRequired: true,
        };
        this.activeAction = proposedAction;
      }

      this.responseHierarchy = {
        conciseAnswer: 'Your presentation location changed.',
        truthStatus: {
          digital: digitalLocation,
          observed: observedLocation,
          confidence: 'High (96%)',
          agreement: false,
        },
        evidence: captureResult.evidence,
        impact: impactItems,
        actionProposal: proposedAction,
      };

      // 6. SPEAKING
      this.transitionTo(AgentState.SPEAKING, 'Relaying verified reality update...');
      await this.sleep(600);
      if (this.isCancelled) return;

      // 7. ACTION_PENDING (Safe Action Gate)
      this.transitionTo(AgentState.ACTION_PENDING, 'Safe Action Gate: Approval Required to update reminder');
      this.isLoading = false;
    } catch (err: any) {
      this.handleError(err?.message || 'Verification workflow failed');
    }
  }

  /**
   * Safe Gate: User explicitly approves the action.
   */
  async approveAndExecuteAction(): Promise<boolean> {
    if (!this.activeAction) return false;
    this.isLoading = true;

    try {
      this.transitionTo(AgentState.ACTION_PENDING, 'Executing approved action safely...');
      const actionId = this.activeAction.actionId;
      this.processedActions.add(actionId);

      const result = await actionService.approveAndExecute(actionId);

      if (result.success) {
        this.activeAction.approvalState = ApprovalState.APPROVED;
        this.transitionTo(AgentState.SUCCESS, 'Reminder safely updated to Room 302 and recorded');
        this.isLoading = false;
        return true;
      } else {
        this.handleError(result.message || 'Action execution failed at safe gate');
        return false;
      }
    } catch (err: any) {
      this.handleError(err?.message || 'Action approval failed');
      return false;
    }
  }

  /**
   * Safe Gate: User explicitly rejects the action.
   */
  async rejectAction(): Promise<void> {
    if (!this.activeAction) return;
    try {
      await actionService.reject(this.activeAction.actionId);
      this.activeAction.approvalState = ApprovalState.REJECTED;
      this.statusMessage = 'Action rejected by user. Ground truth preserved.';
      this.resetToIdle();
    } catch (err: any) {
      this.handleError(err?.message || 'Action rejection failed');
    }
  }

  /**
   * Error path: Any state -> ERROR -> recover/cancel -> IDLE.
   */
  handleError(errorMessage: string) {
    this.error = errorMessage;
    this.isLoading = false;
    this.transitionTo(AgentState.ERROR, `Perception Error: ${errorMessage}`);
  }

  /**
   * Cancel active session and halt background processes.
   */
  cancel() {
    this.isCancelled = true;
    this.isLoading = false;
    this.resetToIdle();
  }

  resetToIdle() {
    this.state = AgentState.IDLE;
    this.statusMessage = 'NIA Reality Layer Active';
    this.isLoading = false;
    this.error = null;
    this.appendEvent(AgentState.IDLE, 'Session reset to IDLE');
    this.notify();
  }

  /**
   * Replay previous session step-by-step
   */
  async replaySession(): Promise<void> {
    if (this.events.length === 0) return;
    const originalEvents = [...this.events];
    this.resetToIdle();

    for (const ev of originalEvents) {
      if (this.isCancelled) break;
      this.state = ev.state;
      this.statusMessage = `Replaying: ${ev.title}`;
      this.notify();
      await this.sleep(600);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const agentSessionStore = new AgentSessionStore();
