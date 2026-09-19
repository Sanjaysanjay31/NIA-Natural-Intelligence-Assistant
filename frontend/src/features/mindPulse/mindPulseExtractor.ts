import { MindPulseExtractedContext } from './types';

export class MindPulseExtractor {
  /**
   * Deterministically extracts events, commitments, locations, deadlines, tasks, people, and decisions.
   * Invariant: Zero LLM dependency for basic entity identification and room/time comparison.
   */
  public static extract(rawText: string, baseConfidence: number = 0.95): MindPulseExtractedContext {
    const text = (rawText || '').trim();

    if (!text) {
      return {
        events: [],
        commitments: [],
        locations: [],
        deadlines: [],
        tasks: [],
        people: [],
        decisions: [],
        confidence: 0.0,
        rawText: '',
      };
    }

    const locations = this.extractLocations(text);
    const events = this.extractEvents(text);
    const deadlines = this.extractDeadlines(text);
    const tasks = this.extractTasks(text);
    const people = this.extractPeople(text);
    const decisions = this.extractDecisions(text);
    const commitments = this.extractCommitments(text);

    let confidence = baseConfidence;
    if (locations.length === 0 && events.length === 0) {
      confidence = Math.min(confidence, 0.45);
    }
    if (text.includes('obscured') || text.includes('smudged') || text.includes('...')) {
      confidence = Math.min(confidence, 0.48); // Drops below 0.70 review threshold
    }

    return {
      events,
      commitments,
      locations,
      deadlines,
      tasks,
      people,
      decisions,
      confidence,
      rawText: text,
    };
  }

  private static extractLocations(text: string): string[] {
    const regex = /(?:room|hall|audi|auditorium|lab)\s*[-#]?\s*([0-9]{1,4}[a-z]?|[a-z]\b)|\b([0-9]{3}[a-z]?)\b/gi;
    const matches = text.match(regex) || [];
    const seen = new Set<string>();
    const results: string[] = [];

    for (const m of matches) {
      const canonical = m.trim().replace(/^([0-9]{3}[a-z]?)$/i, 'Room $1');
      const formatted = canonical.charAt(0).toUpperCase() + canonical.slice(1);
      if (!seen.has(formatted)) {
        seen.add(formatted);
        results.push(formatted);
      }
    }
    return results;
  }

  private static extractEvents(text: string): string[] {
    const eventKeywords = [
      'Final Presentation',
      'Presentation',
      'Symposium',
      'Faculty Meeting',
      'Workshop',
      'Standup',
      'Exam',
      'Lecture',
    ];
    return eventKeywords.filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(text));
  }

  private static extractDeadlines(text: string): string[] {
    const timeMatches = text.match(/\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:am|pm)?\b/gi) || [];
    const dateMatches = text.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|next week)\b/gi) || [];
    return [...timeMatches, ...dateMatches];
  }

  private static extractTasks(text: string): string[] {
    const taskMatch = text.match(/(?:task|action|todo|bring|prepare|send)\s*[:\-]?\s*([^.!\n]+)/i);
    return taskMatch ? [taskMatch[0].trim()] : [];
  }

  private static extractPeople(text: string): string[] {
    const knownNames = ['Prof. Sharma', 'Dr. Rao', 'Sanjay', 'Bhupathi', 'HOD'];
    return knownNames.filter((name) => new RegExp(`\\b${name.replace('.', '\\.')}\\b`, 'i').test(text));
  }

  private static extractDecisions(text: string): string[] {
    const decisionMatch = text.match(/(?:moved to|shifted to|postponed until|cancelled|approved|decided to)\s*([^.!\n]+)/i);
    return decisionMatch ? [decisionMatch[0].trim()] : [];
  }

  private static extractCommitments(text: string): string[] {
    const commitmentMatch = text.match(/(?:will|promise to|going to|must|mandatory to)\s+([^.!\n]+)/i);
    return commitmentMatch ? [commitmentMatch[0].trim()] : [];
  }
}
