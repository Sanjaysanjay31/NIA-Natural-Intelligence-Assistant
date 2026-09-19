import { WakeUpSource, AgentState } from '../../contracts/enums';
import { WakeUpEvent, WakeUpCapabilities, Session } from '../../contracts/intent';

export interface WakeUpRouteTarget {
  source: WakeUpSource;
  targetRoute: 'VOICE_PIPELINE' | 'VERIFY_CONTEXT' | 'MIND_PULSE' | 'AGENT_HOME';
  initialState: AgentState;
  description: string;
}

export interface IWakeUpAdapter {
  getCapabilities(): WakeUpCapabilities;
  triggerWakeUp(source: WakeUpSource, payload?: Record<string, any>): Promise<WakeUpEvent>;
  onWakeUp(listener: (event: WakeUpEvent) => void): () => void;
  isAlwaysListeningSupported(): boolean;
}
