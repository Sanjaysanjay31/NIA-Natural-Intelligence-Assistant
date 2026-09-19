import React from 'react';
import { AgentProvider } from './src/state';
import { AppShell } from './src/components';
import { AgentScreen } from './src/features/reality/AgentScreen';

export default function App() {
  return (
    <AgentProvider>
      <AppShell>
        <AgentScreen />
      </AppShell>
    </AgentProvider>
  );
}
