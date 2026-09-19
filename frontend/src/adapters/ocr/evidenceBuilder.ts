import { PhysicalObservation, EvidenceItem } from '../../contracts';
import { ExtractionResult, OCRResult } from './types';

export class EvidenceBuilder {
  /**
   * Builds an EvidenceItem adhering strictly to the shared domain contract.
   * Privacy: Local image URI is kept as a local device reference only.
   */
  public static buildEvidenceItem(
    ocrResult: OCRResult,
    extraction: ExtractionResult,
    evidenceId?: string
  ): EvidenceItem {
    const id = evidenceId || `ev-ocr-${Date.now()}`;
    return {
      evidenceId: id,
      source: ocrResult.isSimulated ? 'camera/simulated_ocr' : 'camera/OCR',
      snippet: extraction.rawText || ocrResult.rawText || 'No text detected',
      confidence: extraction.confidence,
      capturedAt: ocrResult.capturedAt,
      // Local reference only - raw image stays on phone, never uploaded to backend
      mediaRef: ocrResult.metadata?.imageUri ? `device-local://${ocrResult.metadata.imageUri}` : undefined,
      metadata: {
        isSimulated: ocrResult.isSimulated,
        providerType: ocrResult.providerType,
        isAmbiguous: extraction.isAmbiguous,
        candidateRooms: extraction.candidateRooms,
        noticeType: extraction.noticeType,
        privacyMode: 'ON_DEVICE_ONLY',
      },
    };
  }

  /**
   * Builds a PhysicalObservation adhering strictly to the shared domain contract.
   */
  public static buildPhysicalObservation(
    ocrResult: OCRResult,
    extraction: ExtractionResult,
    targetEntity: string = 'Final Presentation',
    observationId?: string
  ): PhysicalObservation {
    const id = observationId || `obs-phys-${Date.now()}`;
    return {
      id,
      source: ocrResult.isSimulated ? 'camera/simulated_ocr' : 'camera/OCR',
      entity: targetEntity,
      location: extraction.location,
      rawText: extraction.rawText,
      confidence: extraction.confidence,
      mediaRef: ocrResult.metadata?.imageUri ? `device-local://${ocrResult.metadata.imageUri}` : undefined,
      observedAt: ocrResult.capturedAt,
      metadata: {
        isSimulated: ocrResult.isSimulated,
        providerType: ocrResult.providerType,
        isAmbiguous: extraction.isAmbiguous,
        candidateRooms: extraction.candidateRooms,
        previousLocation: extraction.previousLocation,
        noticeType: extraction.noticeType,
      },
    };
  }
}
