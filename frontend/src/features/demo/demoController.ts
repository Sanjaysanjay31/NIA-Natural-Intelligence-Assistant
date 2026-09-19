import { DemoScenarioState } from './types';
import {
  DEMO_ENTITY,
  DEMO_EVENT_ID,
  DEMO_SESSION_ID,
  DEMO_DIGITAL_LOCATION,
  DEMO_DIGITAL_TIME,
  DEMO_DIGITAL_SOURCE,
  DEMO_PHYSICAL_NOTICE_TEXT,
  DEMO_PHYSICAL_LOCATION,
  DEMO_PHYSICAL_SOURCE,
  DEMO_USER_QUERY,
  DEMO_DRIFT_TYPE,
  DEMO_CONFIDENCE,
  DEMO_IMPACT_ITEMS,
  DEMO_PROPOSED_ACTION,
  DEMO_STEPS_METADATA,
} from './demoFixture';

export class DemoController {
  private currentStep = 1;
  private isAutoPlaying = false;
  private debugMode = true;
  private autoPlayTimer: any = null;
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getState(): DemoScenarioState {
    const meta = DEMO_STEPS_METADATA[this.currentStep - 1];

    const isVerifying = this.currentStep >= 5;
    const hasPhysicalNotice = this.currentStep >= 6;
    const hasOcr = this.currentStep >= 7;
    const hasDrift = this.currentStep >= 8;
    const hasEvidenceReplay = this.currentStep >= 9;
    const hasImpact = this.currentStep >= 10;
    const hasProposedAction = this.currentStep >= 11;
    const isAwaitingApproval = this.currentStep === 12;
    const isApproved = this.currentStep >= 13;
    const isExecuted = this.currentStep >= 14;
    const isSuccess = this.currentStep >= 15;
    const hasTimelineEvent = this.currentStep >= 16;
    const hasExportedAudit = this.currentStep >= 17;

    let approvalState: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'NONE';
    if (isAwaitingApproval) {
      approvalState = 'PENDING';
    } else if (isApproved) {
      approvalState = 'APPROVED';
    }

    let executionState: 'NOT_EXECUTED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' = 'NOT_EXECUTED';
    if (isExecuted) {
      executionState = 'SUCCEEDED';
    }

    const currentLoc = isExecuted ? DEMO_PHYSICAL_LOCATION : DEMO_DIGITAL_LOCATION;

    return {
      sessionId: DEMO_SESSION_ID,
      step: this.currentStep,
      totalSteps: 17,
      title: meta.title,
      description: meta.description,
      agentState: meta.agentState,
      entity: DEMO_ENTITY,
      digitalState: {
        eventId: DEMO_EVENT_ID,
        title: DEMO_ENTITY,
        time: DEMO_DIGITAL_TIME,
        location: DEMO_DIGITAL_LOCATION,
        source: DEMO_DIGITAL_SOURCE,
      },
      userQuery: this.currentStep >= 4 ? DEMO_USER_QUERY : null,
      physicalObservation: {
        rawText: hasPhysicalNotice ? DEMO_PHYSICAL_NOTICE_TEXT : null,
        extractedLocation: hasOcr ? DEMO_PHYSICAL_LOCATION : null,
        source: hasPhysicalNotice ? DEMO_PHYSICAL_SOURCE : null,
      },
      drift: {
        detected: hasDrift,
        driftType: hasDrift ? DEMO_DRIFT_TYPE : 'NONE',
        confidence: hasDrift ? DEMO_CONFIDENCE : 1.0,
        before: hasDrift ? DEMO_DIGITAL_LOCATION : null,
        current: hasDrift ? DEMO_PHYSICAL_LOCATION : null,
      },
      evidenceReplayActive: hasEvidenceReplay,
      impactItems: hasImpact ? DEMO_IMPACT_ITEMS : [],
      action: {
        proposed: hasProposedAction,
        actionId: DEMO_PROPOSED_ACTION.actionId,
        type: DEMO_PROPOSED_ACTION.type,
        description: DEMO_PROPOSED_ACTION.description,
        approvalState,
        executionState,
      },
      currentEffectiveLocation: currentLoc,
      timelineRecorded: hasTimelineEvent,
      auditExported: hasExportedAudit,
      isAutoPlaying: this.isAutoPlaying,
      debugMode: this.debugMode,
    };
  }

  public stepForward(): void {
    if (this.currentStep < 17) {
      this.currentStep++;
      this.notify();
    } else {
      this.stopAutoPlay();
    }
  }

  public stepBackward(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.notify();
    }
  }

  public jumpToStep(step: number): void {
    if (step >= 1 && step <= 17) {
      this.currentStep = step;
      this.notify();
    }
  }

  public reset(): void {
    this.stopAutoPlay();
    this.currentStep = 1;
    this.notify();
  }

  public toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    this.notify();
  }

  public toggleAutoPlay(intervalMs = 2500): void {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    } else {
      this.isAutoPlaying = true;
      this.notify();
      this.autoPlayTimer = setInterval(() => {
        if (this.currentStep < 17) {
          this.stepForward();
        } else {
          this.stopAutoPlay();
        }
      }, intervalMs);
    }
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.isAutoPlaying = false;
    this.notify();
  }
}

export const demoController = new DemoController();
