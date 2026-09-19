import { OCRResult } from '../../adapters/ocr/types';

export type ModelStatus =
  | 'NOT_INSTALLED'
  | 'DOWNLOADING'
  | 'INSTALLED'
  | 'LOADING'
  | 'READY'
  | 'UNLOADING'
  | 'ERROR';

export type ModelFormat = 'GGUF' | 'ONNX' | 'EXECUTORCH' | 'TFLITE';
export type QuantizationType = 'q4_k_m' | 'q4_0' | 'int8' | 'fp16';
export type RuntimeEngine = 'onnxruntime' | 'executorch' | 'system_tts' | 'sherpa' | 'simulation';

export interface MinimumDeviceRequirements {
  ramMb: number;
  osVersion: string;
  chipArch: string;
}

export interface ModelManifest {
  name: string;
  version: string;
  size: number; // bytes
  format: ModelFormat;
  quantization: QuantizationType;
  runtime: RuntimeEngine;
  capabilities: string[];
  minimumDeviceRequirements: MinimumDeviceRequirements;
  checksum: string; // SHA-256
  storageRequirement: number; // bytes
}

export interface CapabilityReport {
  localSttAvailable: boolean;
  ocrAvailable: boolean;
  localLlmAvailable: boolean;
  ttsAvailable: boolean;
  nativeRuntimeAvailable: boolean;
  memorySufficient: boolean;
  storageSufficient: boolean;
  activeModels: string[];
  diagnostics: {
    deviceRamMb: number;
    availableStorageMb: number;
    platform: string;
    concurrencySlotsUsed: number;
    maxConcurrencySlots: number;
  };
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface TTSOptions {
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface STTProvider {
  isAvailable(): Promise<boolean>;
  transcribe(audioUri: string): Promise<string>;
  getProviderName(): string;
}

export interface LLMProvider {
  isAvailable(): Promise<boolean>;
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  getProviderName(): string;
}

export interface TTSProvider {
  isAvailable(): Promise<boolean>;
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): Promise<void>;
  getProviderName(): string;
}

export interface CloudFallbackProvider {
  isCloudFallbackAllowed(): boolean;
  requestFallbackInference(task: string, payload: any): Promise<any>;
}
