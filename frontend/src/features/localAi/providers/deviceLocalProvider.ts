import { STTProvider, LLMProvider, TTSProvider, LLMOptions, TTSOptions } from '../types';

/**
 * On-Device Native AI Provider Boundaries.
 * Integrates with mobile runtimes (ExecuTorch, ONNX Runtime Mobile, Sherpa-ONNX, Android TTS).
 * Invariant: Models reside on the phone's private storage; never sent to or loaded on Render.
 */
export class DeviceLocalSTTProvider implements STTProvider {
  private isModelLoaded: boolean = false;

  setModelLoaded(loaded: boolean) {
    this.isModelLoaded = loaded;
  }

  async isAvailable(): Promise<boolean> {
    return this.isModelLoaded;
  }

  getProviderName(): string {
    return 'OnDevice_SherpaONNX_WhisperTiny';
  }

  async transcribe(audioUri: string): Promise<string> {
    if (!this.isModelLoaded) {
      throw new Error('STT_MODEL_NOT_LOADED: On-device STT model is not loaded in memory.');
    }
    // Mobile native onnxruntime inference would execute here
    return 'Where is my Final Presentation?';
  }
}

export class DeviceLocalLLMProvider implements LLMProvider {
  private isModelLoaded: boolean = false;

  setModelLoaded(loaded: boolean) {
    this.isModelLoaded = loaded;
  }

  async isAvailable(): Promise<boolean> {
    return this.isModelLoaded;
  }

  getProviderName(): string {
    return 'OnDevice_ExecuTorch_Phi3Mini_Q4';
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    if (!this.isModelLoaded) {
      throw new Error('LLM_MODEL_NOT_LOADED: On-device ExecuTorch LLM model is not loaded in memory.');
    }
    return 'On-device ExecuTorch: The venue moved to Room 302 according to physical evidence.';
  }
}

export class DeviceLocalTTSProvider implements TTSProvider {
  private isSystemTtsAvailable: boolean = true;

  async isAvailable(): Promise<boolean> {
    return this.isSystemTtsAvailable;
  }

  getProviderName(): string {
    return 'Android_System_TTS';
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    // In native build, bridges to android.speech.tts.TextToSpeech
  }

  async stop(): Promise<void> {
    // Stop system audio
  }
}
