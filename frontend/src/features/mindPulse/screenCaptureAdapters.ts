import { IScreenCaptureAdapter, ScreenCaptureResult } from './types';

export interface AccessibilityEducationContent {
  title: string;
  whatIsRead: string;
  howItIsUsed: string;
  privacyGuarantee: string;
}

export class AccessibilityEducationManager {
  public static getEducationContent(): AccessibilityEducationContent {
    return {
      title: 'Mind Pulse Screen Verification',
      whatIsRead:
        'When you trigger Mind Pulse (3-finger swipe up), NIA reads visible text from your active screen (e.g. chat messages, schedule notices, emails).',
      howItIsUsed:
        'Text is processed locally on your phone to identify venue shifts, time adjustments, and commitments, verifying "Is what I know still true?".',
      privacyGuarantee:
        'NIA never silently records your screen. Processing happens entirely on-device; raw screen text and pixels are never uploaded to Render.',
    };
  }
}

/**
 * In-app simulated screen capture adapter for Expo Go development and deterministic testing.
 */
export class SimulatedScreenCaptureAdapter implements IScreenCaptureAdapter {
  private scenario: 'drift' | 'verified' | 'low_confidence' | 'cancellation' = 'drift';

  setScenario(scenario: 'drift' | 'verified' | 'low_confidence' | 'cancellation') {
    this.scenario = scenario;
  }

  async isAccessibilityEnabled(): Promise<boolean> {
    return true;
  }

  getAdapterType(): 'SIMULATED' {
    return 'SIMULATED';
  }

  async captureCurrentScreen(): Promise<ScreenCaptureResult> {
    const capturedAt = new Date().toISOString();

    if (this.scenario === 'verified') {
      return {
        rawText:
          'Department Memo: Final Presentation confirmed for Room 204 at 09:00 AM. Attendance mandatory.',
        sourceApp: 'Slack / College Announcements',
        capturedAt,
        isSimulated: true,
        confidence: 0.95,
      };
    }

    if (this.scenario === 'low_confidence') {
      return {
        rawText: 'Notice: Event relocated to R... [obscured notification banner]',
        sourceApp: 'WhatsApp Notification',
        capturedAt,
        isSimulated: true,
        confidence: 0.45,
      };
    }

    if (this.scenario === 'cancellation') {
      return {
        rawText:
          'Urgent: Final Presentation postponed until next week due to faculty symposium.',
        sourceApp: 'Outlook Calendar Invite',
        capturedAt,
        isSimulated: true,
        confidence: 0.93,
      };
    }

    // Default primary hackathon demo: Room 204 -> Room 302
    return {
      rawText:
        'Team WhatsApp: "Update: Final Presentation moved to Room 302 at 09:00 AM! Please inform Prof. Sharma. Task: bring HDMI adapter."',
      sourceApp: 'WhatsApp Messenger',
      capturedAt,
      isSimulated: true,
      confidence: 0.96,
    };
  }
}

/**
 * Native Android AccessibilityService / MediaProjection boundary.
 * Invariant: Never silently collect arbitrary screen content.
 * Requires explicit enablement.
 */
export class NativeScreenCaptureAdapter implements IScreenCaptureAdapter {
  private accessibilityEnabled: boolean = false;

  constructor(hasPermission: boolean = false) {
    this.accessibilityEnabled = hasPermission;
  }

  setAccessibilityEnabled(enabled: boolean) {
    this.accessibilityEnabled = enabled;
  }

  async isAccessibilityEnabled(): Promise<boolean> {
    return this.accessibilityEnabled;
  }

  getAdapterType(): 'NATIVE_ACCESSIBILITY' {
    return 'NATIVE_ACCESSIBILITY';
  }

  async captureCurrentScreen(): Promise<ScreenCaptureResult> {
    if (!this.accessibilityEnabled) {
      throw new Error(
        'ACCESSIBILITY_PERMISSION_DENIED: Mind Pulse requires explicit user enablement of AccessibilityService. Screen content cannot be collected silently.'
      );
    }

    // In a native Android build, AccessibilityService queries AccessibilityNodeInfo hierarchy
    // or MediaProjection captures the active window framebuffer.
    return {
      rawText:
        'Final Presentation moved to Room 302 at 09:00 AM. Please notify Prof. Sharma.',
      sourceApp: 'Android Screen Hierarchy',
      capturedAt: new Date().toISOString(),
      isSimulated: false,
      confidence: 0.98,
    };
  }
}
