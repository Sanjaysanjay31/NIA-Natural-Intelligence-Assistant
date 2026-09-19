import { STTProvider, LLMProvider, TTSProvider, LLMOptions, TTSOptions } from '../types';

export class DemoSTTProvider implements STTProvider {
  async isAvailable(): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'DemoSTT (Simulated)';
  }

  async transcribe(audioUri: string): Promise<string> {
    // Deterministic simulation for Expo Go
    return 'Where is my Final Presentation scheduled?';
  }
}

export class DemoLLMProvider implements LLMProvider {
  async isAvailable(): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'DemoLLM (Deterministic Fallback)';
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const lower = (prompt || '').toLowerCase();
    if (lower.includes('why') || lower.includes('drift')) {
      return (
        'Your presentation was shifted because a physical notice was detected at the department board: ' +
        '"Presentations moved to Room 302." Your calendar still lists Room 204.'
      );
    }
    if (lower.includes('affect') || lower.includes('impact')) {
      return (
        'This location shift impacts your 08:30 AM departure alarm, the "Prepare slides" reminder, ' +
        'and your review meeting with Prof. Sharma.'
      );
    }
    return (
      'Deterministic Local AI: Reality checking verified that your presentation moved to Room 302.'
    );
  }
}

export class DemoTTSProvider implements TTSProvider {
  private isSpeaking: boolean = false;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'DemoTTS (Simulated Audio)';
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    this.isSpeaking = true;
    // Simulate brief speech utterance
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.isSpeaking = false;
  }

  async stop(): Promise<void> {
    this.isSpeaking = false;
  }
}
