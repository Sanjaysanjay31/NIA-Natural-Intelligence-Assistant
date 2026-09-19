import { WakeUpSource } from '../../contracts/enums';
import { WakeUpCapabilities, WakeUpEvent } from '../../contracts/intent';
import { IWakeUpAdapter } from './types';

/**
 * In-app trigger adapter for Expo Go development.
 * Simulates OS-level activations inside the sandbox without violating platform bounds.
 * Invariant: Never claims "Hey NIA is always listening" in Expo Go.
 */
export class ExpoWakeUpAdapter implements IWakeUpAdapter {
  private listeners: Set<(event: WakeUpEvent) => void> = new Set();

  getCapabilities(): WakeUpCapabilities {
    return {
      alwaysListening: 'simulation', // In-app mic button trigger only
      screenCapture: 'simulation',   // In-app mock / image picker
      gestureSupport: 'simulation',  // In-app pan responder / multi-touch
      platformMode: 'expo_go',
    };
  }

  isAlwaysListeningSupported(): boolean {
    return false; // Strictly false in Expo Go
  }

  onWakeUp(listener: (event: WakeUpEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async triggerWakeUp(
    source: WakeUpSource,
    payload: Record<string, any> = {}
  ): Promise<WakeUpEvent> {
    const event: WakeUpEvent = {
      source,
      timestamp: new Date().toISOString(),
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      payload,
      capabilities: this.getCapabilities(),
      eventId: `ev-wake-${Date.now()}`,
    };

    this.listeners.forEach((fn) => fn(event));
    return event;
  }
}
