import { IOCRProvider, OCROptions, PhysicalObservationState, CaptureResult } from './types';
import { DemoOCRProvider } from './demoOCRProvider';
import { ObservationNormalizer } from './observationNormalizer';
import { EvidenceBuilder } from './evidenceBuilder';

export type StateListener = (state: PhysicalObservationState) => void;

export class PhysicalObservationCapture {
  private provider: IOCRProvider;
  private state: PhysicalObservationState = 'IDLE';
  private listeners: Set<StateListener> = new Set();
  private lastCapturedText: string = '';
  private lastCaptureTimeMs: number = 0;
  private duplicateWindowMs: number = 5000;

  constructor(provider?: IOCRProvider) {
    this.provider = provider || new DemoOCRProvider();
  }

  setProvider(provider: IOCRProvider) {
    this.provider = provider;
  }

  getState(): PhysicalObservationState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: PhysicalObservationState) {
    this.state = newState;
    this.listeners.forEach((fn) => fn(newState));
  }

  /**
   * Complete capture pipeline:
   * IDLE -> CAPTURING -> PROCESSING -> EXTRACTING -> READY (or ERROR)
   */
  async captureAndExtract(
    imageUri: string = 'file://camera/last_frame.jpg',
    options: OCROptions = {},
    targetEntity: string = 'Final Presentation'
  ): Promise<CaptureResult> {
    try {
      // 1. CAPTURING state
      this.setState('CAPTURING');
      const isAvail = await this.provider.isAvailable();
      if (!isAvail) {
        throw new Error('OCR_UNAVAILABLE: The OCR provider is unavailable or lacks camera permission.');
      }

      // 2. PROCESSING state (OCR execution)
      this.setState('PROCESSING');
      const ocrResult = await this.provider.processImage(imageUri, options);

      // Check for duplicate capture within time window
      const now = Date.now();
      const isDuplicate =
        ocrResult.rawText === this.lastCapturedText &&
        now - this.lastCaptureTimeMs < this.duplicateWindowMs;

      this.lastCapturedText = ocrResult.rawText;
      this.lastCaptureTimeMs = now;

      // 3. EXTRACTING state (Entity parsing and normalizer)
      this.setState('EXTRACTING');
      const extraction = ObservationNormalizer.extractFromText(
        ocrResult.rawText,
        ocrResult.confidence
      );

      // If blurry image, enforce low confidence
      if (ocrResult.isBlurry) {
        extraction.confidence = Math.min(extraction.confidence, 0.35);
      }

      // 4. Build Evidence and PhysicalObservation
      const evidence = EvidenceBuilder.buildEvidenceItem(ocrResult, extraction);
      if (isDuplicate) {
        evidence.metadata = { ...evidence.metadata, isDuplicateCapture: true };
      }

      const observation = EvidenceBuilder.buildPhysicalObservation(
        ocrResult,
        extraction,
        targetEntity
      );
      if (isDuplicate) {
        observation.metadata = { ...observation.metadata, isDuplicateCapture: true };
      }

      // 5. READY state
      this.setState('READY');
      return {
        state: 'READY',
        rawText: ocrResult.rawText,
        observation,
        evidence,
        extraction,
      };
    } catch (err: any) {
      this.setState('ERROR');
      const errorMessage = err?.message || 'Physical observation capture failed';

      const fallbackExtraction = {
        rawText: '',
        isAmbiguous: false,
        candidateRooms: [],
        confidence: 0.0,
      };

      const emptyOcrResult = {
        rawText: '',
        confidence: 0.0,
        providerType: this.provider.getProviderType(),
        isSimulated: true,
        capturedAt: new Date().toISOString(),
        isBlurry: false,
      };

      return {
        state: 'ERROR',
        rawText: '',
        observation: EvidenceBuilder.buildPhysicalObservation(
          emptyOcrResult,
          fallbackExtraction,
          targetEntity
        ),
        evidence: EvidenceBuilder.buildEvidenceItem(emptyOcrResult, fallbackExtraction),
        extraction: fallbackExtraction,
        error: errorMessage,
      };
    }
  }

  reset() {
    this.setState('IDLE');
  }
}

export const physicalObservationCapture = new PhysicalObservationCapture();
