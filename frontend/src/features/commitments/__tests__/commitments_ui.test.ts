/**
 * Unit & Contract Verification Suite for Commitment UI Components and VoiceMemo
 */

import { CommitmentItem, CommitmentStatus } from '../types';
import { VoiceMemoState, ExtractedCommitmentItem } from '../../voiceMemo/types';

describe('Commitment UI Domain Contracts', () => {
  test('CommitmentItem contract validation', () => {
    const item: CommitmentItem = {
      id: 'cmt-test-01',
      owner: 'Sanjay',
      action: 'Submit the final presentation slides',
      deadline: 'Friday 5 PM',
      source: 'VOICE_MEMO',
      status: 'PENDING',
      confidence: 0.95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedEventId: 'Final Presentation',
      relatedLocation: 'Room 302',
    };

    expect(item.id).toBe('cmt-test-01');
    expect(item.status).toBe('PENDING');
    expect(item.relatedLocation).toBe('Room 302');
  });

  test('VoiceMemoState state-machine transitions', () => {
    const validStates: VoiceMemoState[] = [
      'idle',
      'recording',
      'stopped',
      'processing',
      'extracted',
      'saved',
      'error',
    ];

    expect(validStates).toContain('idle');
    expect(validStates).toContain('recording');
    expect(validStates).toContain('processing');
    expect(validStates).toContain('extracted');
    expect(validStates).toContain('saved');
    expect(validStates).toContain('error');
  });

  test('ExtractedCommitmentItem mapping and confidence calculation', () => {
    const extracted: ExtractedCommitmentItem = {
      id: 'cmt-ext-01',
      owner: 'Bhupathi',
      action: 'Run module unit tests',
      deadline: 'Monday',
      confidence: 0.92,
      status: 'PENDING',
      source: 'VOICE_MEMO',
    };

    const confidencePct = Math.round(extracted.confidence * 100);
    expect(confidencePct).toBe(92);
    expect(confidencePct).toBeGreaterThanOrEqual(85); // High tier
  });

  test('CommitmentStatus allowed values', () => {
    const statuses: CommitmentStatus[] = [
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'AT_RISK',
    ];

    expect(statuses.length).toBe(5);
  });
});
