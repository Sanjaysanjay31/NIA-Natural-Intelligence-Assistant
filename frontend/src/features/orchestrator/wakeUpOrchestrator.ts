import { WakeUpSource, AgentState } from '../../contracts/enums';
import { WakeUpEvent, Session } from '../../contracts/intent';
import { IWakeUpAdapter, WakeUpRouteTarget } from './types';
import { ExpoWakeUpAdapter } from './expoWakeUpAdapter';

export type OrchestratorListener = (session: Session | null, target?: WakeUpRouteTarget) => void;

export class WakeUpOrchestrator {
  private adapter: IWakeUpAdapter;
  private currentSession: Session | null = null;
  private listeners: Set<OrchestratorListener> = new Set();
  private isProcessing: boolean = false;

  constructor(adapter?: IWakeUpAdapter) {
    this.adapter = adapter || new ExpoWakeUpAdapter();
    this.adapter.onWakeUp((event) => {
      this.activate(event);
    });
  }

  setAdapter(adapter: IWakeUpAdapter) {
    this.adapter = adapter;
    this.adapter.onWakeUp((event) => {
      this.activate(event);
    });
  }

  getAdapter(): IWakeUpAdapter {
    return this.adapter;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  subscribe(listener: OrchestratorListener): () => void {
    this.listeners.add(listener);
    listener(this.currentSession);
    return () => this.listeners.delete(listener);
  }

  private notify(target?: WakeUpRouteTarget) {
    this.listeners.forEach((fn) => fn(this.currentSession, target));
  }

  /**
   * Deterministic routing logic for the 4 entry points.
   * Path 1: WAKE_WORD ("Hey NIA") -> LISTENING -> voice pipeline
   * Path 2: ORB (tap/hold/circle) -> VERIFYING -> current context
   * Path 3: MIND_PULSE (3-finger swipe) -> VERIFYING -> capture/extract/verify
   * Path 4: APP_ICON -> IDLE -> full NIA screen
   */
  route(event: WakeUpEvent): WakeUpRouteTarget {
    switch (event.source) {
      case WakeUpSource.WAKE_WORD:
        return {
          source: WakeUpSource.WAKE_WORD,
          targetRoute: 'VOICE_PIPELINE',
          initialState: AgentState.LISTENING,
          description: 'Voice Hotword activated. Orb listening to speech.',
        };

      case WakeUpSource.ORB:
        return {
          source: WakeUpSource.ORB,
          targetRoute: 'VERIFY_CONTEXT',
          initialState: AgentState.VERIFYING,
          description: 'Orb interaction triggered. Verifying current reality context.',
        };

      case WakeUpSource.MIND_PULSE:
        return {
          source: WakeUpSource.MIND_PULSE,
          targetRoute: 'MIND_PULSE',
          initialState: AgentState.VERIFYING,
          description: 'Mind Pulse gesture triggered. Executing screen/camera observation.',
        };

      case WakeUpSource.APP_ICON:
      default:
        return {
          source: WakeUpSource.APP_ICON,
          targetRoute: 'AGENT_HOME',
          initialState: AgentState.IDLE,
          description: 'App launch triggered. Showing full NIA screen.',
        };
    }
  }

  /**
   * Activates NIA through ONE unified pipeline.
   * All 4 paths produce the exact same WakeUpEvent and enter here.
   */
  async activate(event: WakeUpEvent): Promise<Session> {
    const routeTarget = this.route(event);
    const now = new Date().toISOString();

    // Deduplication / active session reuse if triggered rapidly within same session
    const sessionId =
      event.sessionId ||
      this.currentSession?.sessionId ||
      `sess-${Date.now()}`;

    const session: Session = {
      sessionId,
      userId: 'user-default',
      createdAt: this.currentSession?.createdAt || now,
      lastActiveAt: now,
      activeState: routeTarget.initialState,
      context: {
        triggerSource: event.source,
        targetRoute: routeTarget.targetRoute,
        capabilities: event.capabilities,
        payload: event.payload,
      },
    };

    this.currentSession = session;
    this.notify(routeTarget);
    return session;
  }

  /**
   * Cancel active session and transition cleanly back to IDLE.
   */
  cancel() {
    if (this.currentSession) {
      this.currentSession = {
        ...this.currentSession,
        activeState: AgentState.IDLE,
        lastActiveAt: new Date().toISOString(),
        context: {
          ...this.currentSession.context,
          cancelled: true,
        },
      };
    }
    this.notify();
  }

  reset() {
    this.currentSession = null;
    this.notify();
  }
}

export const wakeUpOrchestrator = new WakeUpOrchestrator();
