import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AgentState } from '../contracts/enums';
import { DriftResult } from '../contracts/reality';

interface AgentContextType {
  state: AgentState;
  statusMessage: string;
  activeDrift: DriftResult | null;
  transitionTo: (nextState: AgentState, message?: string) => void;
  setActiveDrift: (drift: DriftResult | null) => void;
  resetToIdle: () => void;
}

const defaultStatusMessages: Record<AgentState, string> = {
  [AgentState.IDLE]: 'NIA Reality Layer Active',
  [AgentState.LISTENING]: 'Listening for physical or digital updates...',
  [AgentState.THINKING]: 'Cross-referencing digital ground truth...',
  [AgentState.VERIFYING]: 'Analyzing sensor observations...',
  [AgentState.DRIFT]: 'Reality Drift Detected: Immediate Review Advised',
  [AgentState.VERIFIED]: 'Ground Truth Verified & Aligned',
  [AgentState.SPEAKING]: 'Relaying reality audit...',
  [AgentState.ACTION_PENDING]: 'Safe Action Gate: Approval Required',
  [AgentState.SUCCESS]: 'Action Safely Dispatched and Recorded',
  [AgentState.ERROR]: 'Perception Anomaly Encountered',
};

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>(defaultStatusMessages[AgentState.IDLE]);
  const [activeDrift, setActiveDrift] = useState<DriftResult | null>(null);

  const transitionTo = (nextState: AgentState, customMessage?: string) => {
    setState(nextState);
    setStatusMessage(customMessage || defaultStatusMessages[nextState]);
  };

  const resetToIdle = () => {
    setState(AgentState.IDLE);
    setStatusMessage(defaultStatusMessages[AgentState.IDLE]);
    setActiveDrift(null);
  };

  return (
    <AgentContext.Provider
      value={{
        state,
        statusMessage,
        activeDrift,
        transitionTo,
        setActiveDrift,
        resetToIdle,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
