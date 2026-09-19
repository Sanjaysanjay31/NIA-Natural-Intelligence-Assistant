import { config } from '../config/env';
import { ProposedAction, ActionExecutionResult } from '../contracts/action';

/**
 * Safe Action Gate Service
 * Handles: PROPOSE -> ASK -> APPROVE/REJECT -> EXECUTE -> RECORD
 * Invariant: UI components must call this service; direct repository mutations are strictly forbidden.
 */
export class ActionService {
  private baseUrl: string;

  constructor(baseUrl: string = config.apiUrl) {
    this.baseUrl = baseUrl;
  }

  async getAction(actionId: string): Promise<ProposedAction> {
    const res = await fetch(`${this.baseUrl}/api/v1/actions/${actionId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch action '${actionId}': status ${res.status}`);
    }
    return res.json();
  }

  async approveAction(
    actionId: string,
    method: string = 'button_tap'
  ): Promise<ActionExecutionResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/actions/${actionId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvedBy: 'user',
        approvalMethod: method,
      }),
    });
    if (!res.ok) {
      throw new Error(`Approval failed with status ${res.status}`);
    }
    return res.json();
  }

  async rejectAction(
    actionId: string,
    reason: string = 'Rejected by user'
  ): Promise<ProposedAction> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/actions/${actionId}/reject?notes=${encodeURIComponent(
        reason
      )}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      throw new Error(`Rejection failed with status ${res.status}`);
    }
    return res.json();
  }

  async approveAndExecute(actionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.approveAction(actionId);
      return {
        success: result.executionStatus === 'SUCCEEDED' || result.approvalState === 'APPROVED' as any,
        message: result.auditSummary,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Approval execution failed' };
    }
  }

  async reject(actionId: string, reason: string = 'Rejected by user'): Promise<ProposedAction> {
    return this.rejectAction(actionId, reason);
  }
}

export const actionService = new ActionService();
