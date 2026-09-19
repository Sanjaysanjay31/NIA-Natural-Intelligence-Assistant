import { PhysicalObservation, EvidenceItem } from '../../contracts';

export type PhysicalObservationState =
  | 'IDLE'
  | 'CAPTURING'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'READY'
  | 'ERROR';

export type OCRProviderType = 'NATIVE_MLKIT' | 'LOCAL_SIMULATED' | 'MOCK';

export interface OCROptions {
  isBlurry?: boolean;
  simulateNoText?: boolean;
  simulateMultipleRooms?: boolean;
  simulateAmbiguous?: boolean;
  simulateLowConfidence?: boolean;
  forceError?: string;
  sourceType?: 'camera' | 'screen_capture' | 'image_picker';
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  providerType: OCRProviderType;
  isSimulated: boolean;
  capturedAt: string;
  isBlurry: boolean;
  metadata?: Record<string, any>;
}

export interface ExtractionResult {
  rawText: string;
  location?: string;
  previousLocation?: string;
  isAmbiguous: boolean;
  candidateRooms: string[];
  confidence: number;
  noticeType?: 'ROOM_CHANGE' | 'CANCELLATION' | 'TIME_CHANGE' | 'GENERAL';
}

export interface IOCRProvider {
  isAvailable(): Promise<boolean>;
  getProviderType(): OCRProviderType;
  processImage(imageUri: string, options?: OCROptions): Promise<OCRResult>;
}

export interface CaptureResult {
  state: PhysicalObservationState;
  rawText: string;
  observation: PhysicalObservation;
  evidence: EvidenceItem;
  extraction: ExtractionResult;
  error?: string;
}
