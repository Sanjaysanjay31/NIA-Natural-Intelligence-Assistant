import {
  ModelManifest,
  ModelStatus,
  CapabilityReport,
} from './types';

export class ModelManager {
  private manifests: Map<string, ModelManifest> = new Map();
  private modelStates: Map<string, ModelStatus> = new Map();
  private activeModels: Set<string> = new Set();
  private maxConcurrencySlots: number = 1; // Strict phone safety: avoid STT + LLM simultaneously
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.seedDefaultManifests();
  }

  private seedDefaultManifests() {
    const defaultManifests: ModelManifest[] = [
      {
        name: 'whisper-tiny-en-q4',
        version: '1.0.2',
        size: 39 * 1024 * 1024, // 39 MB
        format: 'ONNX',
        quantization: 'int8',
        runtime: 'sherpa',
        capabilities: ['speech_to_text', 'wake_word_verification'],
        minimumDeviceRequirements: {
          ramMb: 2048,
          osVersion: 'Android 10+',
          chipArch: 'arm64-v8a',
        },
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        storageRequirement: 45 * 1024 * 1024,
      },
      {
        name: 'phi-3-mini-4k-instruct-q4',
        version: '3.14.0',
        size: 2180 * 1024 * 1024, // 2.18 GB
        format: 'EXECUTORCH',
        quantization: 'q4_k_m',
        runtime: 'executorch',
        capabilities: ['explanation', 'intent_understanding', 'fallback_extraction'],
        minimumDeviceRequirements: {
          ramMb: 6144, // 6 GB RAM
          osVersion: 'Android 12+',
          chipArch: 'arm64-v8a',
        },
        checksum: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        storageRequirement: 2300 * 1024 * 1024,
      },
      {
        name: 'mlkit-text-v2',
        version: '2.0.0',
        size: 15 * 1024 * 1024, // 15 MB
        format: 'TFLITE',
        quantization: 'int8',
        runtime: 'onnxruntime',
        capabilities: ['ocr_text_recognition', 'bounding_box'],
        minimumDeviceRequirements: {
          ramMb: 1024,
          osVersion: 'Android 8+',
          chipArch: 'any',
        },
        checksum: 'c248b139707297e68266fe859e944b260907d8858d4a974feee19d28f73dd494',
        storageRequirement: 20 * 1024 * 1024,
      },
      {
        name: 'android-system-tts',
        version: '1.0.0',
        size: 0, // Native system engine
        format: 'ONNX',
        quantization: 'fp16',
        runtime: 'system_tts',
        capabilities: ['text_to_speech', 'voice_guidance'],
        minimumDeviceRequirements: {
          ramMb: 512,
          osVersion: 'Android 8+',
          chipArch: 'any',
        },
        checksum: 'system_embedded_tts_engine',
        storageRequirement: 0,
      },
    ];

    defaultManifests.forEach((m) => {
      this.manifests.set(m.name, m);
      // Demo initialization: MLKit and TTS are ready, STT and LLM installed
      if (m.name === 'android-system-tts' || m.name === 'mlkit-text-v2') {
        this.modelStates.set(m.name, 'READY');
        this.activeModels.add(m.name);
      } else {
        this.modelStates.set(m.name, 'INSTALLED');
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  status(modelName: string): ModelStatus {
    return this.modelStates.get(modelName) || 'NOT_INSTALLED';
  }

  async discover(): Promise<ModelManifest[]> {
    return Array.from(this.manifests.values());
  }

  async download(modelName: string): Promise<boolean> {
    const manifest = this.manifests.get(modelName);
    if (!manifest) return false;

    this.modelStates.set(modelName, 'DOWNLOADING');
    this.notify();

    // Async download simulation
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.modelStates.set(modelName, 'INSTALLED');
    this.notify();
    return true;
  }

  async verifyChecksum(modelName: string, checksum: string): Promise<boolean> {
    const manifest = this.manifests.get(modelName);
    if (!manifest) return false;
    return manifest.checksum === checksum;
  }

  async install(modelName: string): Promise<boolean> {
    const manifest = this.manifests.get(modelName);
    if (!manifest) return false;
    this.modelStates.set(modelName, 'INSTALLED');
    this.notify();
    return true;
  }

  /**
   * Loads model into active memory.
   * Enforces Concurrency Safety: Never runs STT + LLM simultaneously on constrained phone RAM.
   */
  async load(modelName: string): Promise<boolean> {
    const manifest = this.manifests.get(modelName);
    if (!manifest) return false;

    // Concurrency Rule: Avoid STT + LLM simultaneously
    if (this.activeModels.size >= this.maxConcurrencySlots) {
      // Automatically unload non-system active models to free RAM
      for (const activeName of Array.from(this.activeModels)) {
        if (activeName !== 'android-system-tts' && activeName !== 'mlkit-text-v2') {
          await this.unload(activeName);
        }
      }
    }

    this.modelStates.set(modelName, 'LOADING');
    this.notify();

    // Asynchronous load without blocking the UI
    await new Promise((resolve) => setTimeout(resolve, 250));
    this.modelStates.set(modelName, 'READY');
    this.activeModels.add(modelName);
    this.notify();
    return true;
  }

  async unload(modelName: string): Promise<boolean> {
    this.modelStates.set(modelName, 'UNLOADING');
    this.activeModels.delete(modelName);
    this.notify();

    await new Promise((resolve) => setTimeout(resolve, 100));
    this.modelStates.set(modelName, 'INSTALLED');
    this.notify();
    return true;
  }

  async delete(modelName: string): Promise<boolean> {
    await this.unload(modelName);
    this.modelStates.set(modelName, 'NOT_INSTALLED');
    this.notify();
    return true;
  }

  /**
   * Generates capability report for local AI runtime status.
   */
  getCapabilityReport(): CapabilityReport {
    const isSttReady = this.status('whisper-tiny-en-q4') === 'READY';
    const isLlmReady = this.status('phi-3-mini-4k-instruct-q4') === 'READY';
    const isOcrReady = this.status('mlkit-text-v2') === 'READY';
    const isTtsReady = this.status('android-system-tts') === 'READY';

    return {
      localSttAvailable: isSttReady,
      ocrAvailable: isOcrReady,
      localLlmAvailable: isLlmReady,
      ttsAvailable: isTtsReady,
      nativeRuntimeAvailable: true,
      memorySufficient: true,
      storageSufficient: true,
      activeModels: Array.from(this.activeModels),
      diagnostics: {
        deviceRamMb: 8192,
        availableStorageMb: 45000,
        platform: 'iQOO Neo / Android',
        concurrencySlotsUsed: this.activeModels.size,
        maxConcurrencySlots: this.maxConcurrencySlots,
      },
    };
  }
}

export const modelManager = new ModelManager();
