import { ExtractionResult } from './types';

export class ObservationNormalizer {
  private static ROOM_PATTERNS = [
    /(?:room|hall|audi|auditorium|seminar hall|lab)\s*[-#]?\s*([0-9]{1,4}[a-z]?|[a-z]\b)/gi,
    /\b([0-9]{3}[a-z]?)\b/gi,
  ];

  /**
   * Canonicalize room string into uniform format e.g. "Room 302"
   */
  public static canonicalizeRoom(raw: string): string {
    const trimmed = raw.trim();
    const match = trimmed.match(/(?:room|hall|audi|auditorium|lab)?\s*[-#]?\s*([0-9]{1,4}[a-z]?|[a-z]\b)/i);
    if (match && match[1]) {
      const val = match[1].toUpperCase();
      if (/^[0-9]+[a-z]?$/i.test(val)) {
        return `Room ${val}`;
      }
      return val.length === 1 ? `Hall ${val}` : trimmed;
    }
    return trimmed;
  }

  /**
   * Parse raw OCR text into structured extraction result
   */
  public static extractFromText(rawText: string, baseConfidence: number = 0.95): ExtractionResult {
    const trimmed = (rawText || '').trim();

    if (!trimmed) {
      return {
        rawText: '',
        isAmbiguous: false,
        candidateRooms: [],
        confidence: 0.0,
        noticeType: 'GENERAL',
      };
    }

    const lower = trimmed.toLowerCase();

    // Check for cancellation keywords
    if (lower.includes('cancel') || lower.includes('postpone') || lower.includes('called off')) {
      return {
        rawText: trimmed,
        isAmbiguous: false,
        candidateRooms: [],
        confidence: baseConfidence,
        noticeType: 'CANCELLATION',
      };
    }

    // Check ambiguity indicators like "or", "either", "maybe"
    const hasAmbiguityIndicator = /\b(or|either|check with|tbd|tentative)\b/i.test(trimmed);

    // Directional change patterns: "moved from [X] to [Y]" or "shifted to [Y]" or "relocated to [Y]"
    const movedToMatch = trimmed.match(/(?:moved|shifted|relocated|transferred|changed)\s+(?:from\s+(.*?)\s+)?to\s+([A-Za-z0-9\s#-]+)/i);
    if (movedToMatch && !hasAmbiguityIndicator) {
      const fromPart = movedToMatch[1];
      const toPart = movedToMatch[2];

      const toRooms = this.findAllRooms(toPart);
      const fromRooms = fromPart ? this.findAllRooms(fromPart) : [];

      if (toRooms.length === 1) {
        const toRoom = toRooms[0];
        const fromRoom = fromRooms.length > 0 ? fromRooms[0] : undefined;
        return {
          rawText: trimmed,
          location: toRoom,
          previousLocation: fromRoom,
          isAmbiguous: false,
          candidateRooms: fromRoom ? [fromRoom, toRoom] : [toRoom],
          confidence: baseConfidence,
          noticeType: 'ROOM_CHANGE',
        };
      }
    }

    // Extract all candidate rooms
    const candidateRooms = this.findAllRooms(trimmed);

    if (candidateRooms.length === 0) {
      return {
        rawText: trimmed,
        isAmbiguous: false,
        candidateRooms: [],
        confidence: Math.min(baseConfidence, 0.4),
        noticeType: 'GENERAL',
      };
    }

    if (candidateRooms.length === 1) {
      return {
        rawText: trimmed,
        location: candidateRooms[0],
        isAmbiguous: false,
        candidateRooms,
        confidence: baseConfidence,
        noticeType: 'ROOM_CHANGE',
      };
    }

    // Multiple rooms found without clear "moved to" preposition
    if (hasAmbiguityIndicator || candidateRooms.length > 2) {
      return {
        rawText: trimmed,
        isAmbiguous: true,
        candidateRooms,
        confidence: Math.min(baseConfidence * 0.5, 0.48), // Drops below review threshold 0.7
        noticeType: 'ROOM_CHANGE',
      };
    }

    // Exactly 2 rooms: check if the second room is the new destination
    return {
      rawText: trimmed,
      location: candidateRooms[candidateRooms.length - 1],
      previousLocation: candidateRooms[0],
      isAmbiguous: false,
      candidateRooms,
      confidence: baseConfidence * 0.85,
      noticeType: 'ROOM_CHANGE',
    };
  }

  private static findFirstRoom(text: string): string | undefined {
    const rooms = this.findAllRooms(text);
    return rooms.length > 0 ? rooms[0] : undefined;
  }

  private static findAllRooms(text: string): string[] {
    const found: string[] = [];
    const seen = new Set<string>();

    for (const pattern of this.ROOM_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const canonical = this.canonicalizeRoom(match[0]);
        if (!seen.has(canonical)) {
          seen.add(canonical);
          found.push(canonical);
        }
      }
    }
    return found;
  }
}
