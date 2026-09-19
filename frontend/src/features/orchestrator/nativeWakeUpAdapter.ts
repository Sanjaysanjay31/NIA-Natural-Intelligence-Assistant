import { WakeUpSource } from '../../contracts/enums';
import { WakeUpCapabilities, WakeUpEvent } from '../../contracts/intent';
import { IWakeUpAdapter } from './types';

/**
 * Native development-build adapter boundary.
 * Bridges Android Foreground Service, Porcupine / Snowboy Hotword engine,
 * and AccessibilityService gestures when running in a standalone APK/AAB build.
 */
export class NativeWakeUpAdapter implements IWakeUpAdapter {
  private listeners: Set<(event: WakeUpEvent) => void> = new Set();
  private nativeServiceActive: boolean = false;

  constructor(hasNativeService: boolean = false) {
    this.nativeServiceActive = hasNativeService;
  }

  setNativeServiceActive(active: boolean) {
    this.nativeServiceActive = active;
  }

  getCapabilities(): WakeUpCapabilities {
    return {
      alwaysListening: this.nativeServiceActive ? 'supported' : 'unavailable',
      screenCapture: this.nativeServiceActive ? 'supported' : 'unavailable',
      gestureSupport: this.nativeServiceActive ? 'supported' : 'unavailable',
      platformMode: 'native_android',
    };
  }

  isAlwaysListeningSupported(): boolean {
    return this.nativeServiceActive;
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
      sessionId: `native-sess-${Date.now()}`,
      payload,
      capabilities: this.getCapabilities(),
      eventId: `native-ev-wake-${Date.now()}`,
    };

    this.listeners.forEach((fn) => fn(event));
    return event;
  }
}
