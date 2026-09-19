import { IIntentRouter, IntentRouteResult, VoiceIntentType } from './types';

export class IntentRouter implements IIntentRouter {
  /**
   * Deterministically routes transcript or text input into intent targets.
   * Both voice speech and text input exercise this exact same router.
   */
  route(input: string): IntentRouteResult {
    const trimmed = (input || '').trim().toLowerCase();

    if (!trimmed) {
      return {
        intent: 'HELP',
        confidence: 0.0,
        rawInput: input,
      };
    }

    // 1. CANCEL / STOP
    if (
      trimmed === 'cancel' ||
      trimmed === 'stop' ||
      trimmed === 'nevermind' ||
      trimmed === 'dismiss' ||
      trimmed.includes('abort')
    ) {
      return { intent: 'CANCEL', confidence: 0.99, rawInput: input };
    }

    // 2. FIX IT
    if (
      trimmed === 'fix it' ||
      trimmed === 'fix' ||
      trimmed === 'update' ||
      trimmed === 'apply change' ||
      trimmed.includes('fix it') ||
      trimmed.includes('update reminder')
    ) {
      return { intent: 'FIX_IT', confidence: 0.98, rawInput: input };
    }

    // 3. WHY
    if (
      trimmed === 'why' ||
      trimmed === 'why?' ||
      trimmed.includes('why did it change') ||
      trimmed.includes('reason') ||
      trimmed.includes('explain')
    ) {
      return { intent: 'WHY', confidence: 0.96, rawInput: input };
    }

    // 4. WHAT CHANGED
    if (
      trimmed === 'what changed' ||
      trimmed === 'what changed?' ||
      trimmed.includes('what moved') ||
      trimmed.includes('difference') ||
      trimmed.includes('before and after')
    ) {
      return { intent: 'WHAT_CHANGED', confidence: 0.96, rawInput: input };
    }

    // 5. WHAT AFFECTS
    if (
      trimmed === 'what does this affect' ||
      trimmed === 'what does this affect?' ||
      trimmed.includes('affect') ||
      trimmed.includes('impact') ||
      trimmed.includes('who is affected')
    ) {
      return { intent: 'WHAT_AFFECTS', confidence: 0.95, rawInput: input };
    }

    // 6. VERIFY INFORMATION
    if (
      trimmed.includes('still correct') ||
      trimmed.includes('is my presentation') ||
      trimmed.includes('verify') ||
      trimmed.includes('check reality') ||
      trimmed.includes('is it true') ||
      trimmed.includes('room 204')
    ) {
      return {
        intent: 'VERIFY_INFORMATION',
        confidence: 0.95,
        rawInput: input,
        parameters: { entity: 'Final Presentation' },
      };
    }

    // 7. NEXT MEETING
    if (
      trimmed.includes('next meeting') ||
      trimmed.includes('schedule') ||
      trimmed.includes('what do i have') ||
      trimmed.includes('calendar') ||
      trimmed.includes('upcoming')
    ) {
      return { intent: 'NEXT_MEETING', confidence: 0.94, rawInput: input };
    }

    // 8. BHUPATHI EXTENSION POINT: COMMITMENT_EXTRACT
    // Rule: "Do NOT implement commitment extraction. Do NOT create a competing commitment schema."
    // "Leave COMMITMENT_EXTRACT as an extension point for Bhupathi."
    if (
      trimmed.includes('i promised') ||
      trimmed.includes('i will deliver') ||
      trimmed.includes('commitment') ||
      trimmed.includes('voice memo') ||
      trimmed.includes('extract commitments')
    ) {
      return {
        intent: 'COMMITMENT_EXTRACT',
        confidence: 0.92,
        rawInput: input,
        isBhupathiExtensionPoint: true,
      };
    }

    // 9. HELP (Default fallback)
    return {
      intent: 'HELP',
      confidence: 0.60,
      rawInput: input,
    };
  }
}

export const intentRouter = new IntentRouter();
