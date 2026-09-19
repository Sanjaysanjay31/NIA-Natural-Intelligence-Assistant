import { IOCRProvider, OCRResult, OCROptions, OCRProviderType } from './types';

export class DemoOCRProvider implements IOCRProvider {
  private isOcrAvailable: boolean = true;

  setAvailability(available: boolean) {
    this.isOcrAvailable = available;
  }

  getProviderType(): OCRProviderType {
    return 'LOCAL_SIMULATED';
  }

  async isAvailable(): Promise<boolean> {
    return this.isOcrAvailable;
  }

  async processImage(imageUri: string, options: OCROptions = {}): Promise<OCRResult> {
    if (!this.isOcrAvailable) {
      throw new Error('OCR_UNAVAILABLE: Local OCR engine is currently unavailable.');
    }

    if (options.forceError) {
      throw new Error(options.forceError);
    }

    const capturedAt = new Date().toISOString();

    // Edge case: Blurry image
    if (options.isBlurry) {
      return {
        rawText: 'Pr...snt... m...vd R... 3..',
        confidence: 0.35,
        providerType: 'LOCAL_SIMULATED',
        isSimulated: true,
        capturedAt,
        isBlurry: true,
        metadata: { imageUri, blurDetected: true, sharpnessScore: 0.22 },
      };
    }

    // Edge case: No text detected in image
    if (options.simulateNoText) {
      return {
        rawText: '',
        confidence: 0.0,
        providerType: 'LOCAL_SIMULATED',
        isSimulated: true,
        capturedAt,
        isBlurry: false,
        metadata: { imageUri, textBlocks: 0 },
      };
    }

    // Edge case: Multiple rooms in notice
    if (options.simulateMultipleRooms) {
      return {
        rawText: 'Notice: Presentations have moved from Room 204 to Room 302.',
        confidence: 0.94,
        providerType: 'LOCAL_SIMULATED',
        isSimulated: true,
        capturedAt,
        isBlurry: false,
        metadata: { imageUri, multipleEntitiesFound: true },
      };
    }

    // Edge case: Ambiguous room number
    if (options.simulateAmbiguous) {
      return {
        rawText: 'Presentations relocated to Room 101 or Room 102. Check notice board.',
        confidence: 0.45,
        providerType: 'LOCAL_SIMULATED',
        isSimulated: true,
        capturedAt,
        isBlurry: false,
        metadata: { imageUri, ambiguityDetected: true },
      };
    }

    // Edge case: Low confidence capture
    if (options.simulateLowConfidence) {
      return {
        rawText: 'Presentations moved to Room 302 (partial smudge)',
        confidence: 0.58, // Below 0.70 review threshold
        providerType: 'LOCAL_SIMULATED',
        isSimulated: true,
        capturedAt,
        isBlurry: false,
        metadata: { imageUri, lowConfidenceWarning: true },
      };
    }

    // Standard primary hackathon demo scenario:
    // "Presentations moved to Room 302."
    return {
      rawText: 'Presentations moved to Room 302.',
      confidence: 0.96,
      providerType: 'LOCAL_SIMULATED',
      isSimulated: true,
      capturedAt,
      isBlurry: false,
      metadata: {
        imageUri,
        scenario: 'primary_hackathon_demo',
        device: 'phone_camera',
      },
    };
  }
}
