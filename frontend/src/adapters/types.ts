/**
 * Native Capability Adapter Interfaces
 * Decouples hardware-level sensors (Android Dev Build) from rapid UI prototyping (Expo Go).
 */

export interface OcrResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  isSimulated: boolean;
}

export interface IOcrAdapter {
  isAvailable(): Promise<boolean>;
  recognizeText(imageUri: string): Promise<OcrResult>;
}

export interface IWakeWordAdapter {
  isAvailable(): Promise<boolean>;
  startListening(onWake: () => void): Promise<void>;
  stopListening(): Promise<void>;
}

export interface IGestureAdapter {
  isSystemWideGestureSupported(): boolean;
  registerThreeFingerSwipe(onSwipe: () => void): () => void;
}
