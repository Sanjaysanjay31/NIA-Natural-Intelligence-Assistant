import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AgentState, WakeUpSource } from '../contracts/enums';
import { DriftResult } from '../contracts/reality';
import { ProposedAction } from '../contracts/action';
import {
  agentSessionStore,
  SessionEvent,
  ResponseHierarchy,
} from './agentSessionStore';

interface AgentContextType {
  state: AgentState;
  statusMessage: string;
  activeDrift: DriftResult | null;
  activeAction: ProposedAction | null;
  responseHierarchy: ResponseHierarchy | null;
  isLoading: boolean;
  error: string | null;
  events: SessionEvent[];
  sessionId: string;
  startVerification: (source?: WakeUpSource) => Promise<void>;
  approveAction: () => Promise<boolean>;
  rejectAction: () => Promise<void>;
  cancel: () => void;
  retry: () => void;
  replaySession: () => Promise<void>;
  transitionTo: (nextState: AgentState, message?: string) => void;
  setActiveDrift: (drift: DriftResult | null) => void;
  resetToIdle: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AgentState>(agentSessionStore.getState());
  const [statusMessage, setStatusMessage] = useState<string>(agentSessionStore.getStatusMessage());
  const [activeDrift, setActiveDrift] = useState<DriftResult | null>(agentSessionStore.getActiveDrift());
  const [activeAction, setActiveAction] = useState<ProposedAction | null>(agentSessionStore.getActiveAction());
  const [responseHierarchy, setResponseHierarchy] = useState<ResponseHierarchy | null>(agentSessionStore.getResponseHierarchy());
  const [isLoading, setIsLoading] = useState<boolean>(agentSessionStore.getIsLoading());
  const [error, setError] = useState<string | null>(agentSessionStore.getError());
  const [events, setEvents] = useState<SessionEvent[]>(agentSessionStore.getEvents());
  const [sessionId, setSessionId] = useState<string>(agentSessionStore.getSessionId());

  useEffect(() => {
    const unsubscribe = agentSessionStore.subscribe(() => {
      setState(agentSessionStore.getState());
      setStatusMessage(agentSessionStore.getStatusMessage());
      setActiveDrift(agentSessionStore.getActiveDrift());
      setActiveAction(agentSessionStore.getActiveAction());
      setResponseHierarchy(agentSessionStore.getResponseHierarchy());
      setIsLoading(agentSessionStore.getIsLoading());
      setError(agentSessionStore.getError());
      setEvents(agentSessionStore.getEvents());
      setSessionId(agentSessionStore.getSessionId());
    });
    return unsubscribe;
  }, []);

  const startVerification = async (source: WakeUpSource = WakeUpSource.ORB) => {
    await agentSessionStore.runVerificationFlow(source);
  };

  const approveAction = async () => {
    return agentSessionStore.approveAndExecuteAction();
  };

  const rejectAction = async () => {
    await agentSessionStore.rejectAction();
  };

  const cancel = () => {
    agentSessionStore.cancel();
  };

  const retry = () => {
    agentSessionStore.runVerificationFlow(WakeUpSource.ORB);
  };

  const replaySession = async () => {
    await agentSessionStore.replaySession();
  };

  const transitionTo = (nextState: AgentState, customMessage?: string) => {
    agentSessionStore.transitionTo(nextState, customMessage);
  };

  const resetToIdle = () => {
    agentSessionStore.resetToIdle();
  };

  return (
    <AgentContext.Provider
      value={{
        state,
        statusMessage,
        activeDrift,
        activeAction,
        responseHierarchy,
        isLoading,
        error,
        events,
        sessionId,
        startVerification,
        approveAction,
        rejectAction,
        cancel,
        retry,
        replaySession,
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
