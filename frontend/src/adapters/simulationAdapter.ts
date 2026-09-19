import { IOcrAdapter, IWakeWordAdapter, IGestureAdapter, OcrResult } from './types';

/**
 * Deterministic Simulation Adapter for Expo Go development
 * Clearly tags all outputs as simulated without faking unsupported Android OS services.
 */
export class SimulationOcrAdapter implements IOcrAdapter {
  async isAvailable(): Promise<boolean> {
    return true; // Simulation is always available
  }

  async recognizeText(_imageUri: string): Promise<OcrResult> {
    // Primary hackathon fixture: relocation notice
    return {
      text: 'NOTICE: Departmental Presentations moved to Room 302 due to maintenance.',
      confidence: 0.94,
      isSimulated: true,
      boundingBoxes: [
        { x: 50, y: 120, width: 500, height: 60 }
      ]
    };
  }
}

export class SimulationWakeWordAdapter implements IWakeWordAdapter {
  private listening: boolean = false;

  async isAvailable(): Promise<boolean> {
    return false; // Continuous background hotword is NOT supported in Expo Go
  }

  async startListening(_onWake: () => void): Promise<void> {
    this.listening = true;
    // In Expo Go, simulated wake word triggers via UI interaction button
  }

  async stopListening(): Promise<void> {
    this.listening = false;
  }
}

export class SimulationGestureAdapter implements IGestureAdapter {
  isSystemWideGestureSupported(): boolean {
    return false; // System-wide gestures require Android AccessibilityService
  }

  registerThreeFingerSwipe(onSwipe: () => void): () => void {
    // In Expo Go, in-app gestures are captured within the App container
    return () => {};
  }
}
