import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { IntelCore } from './components/IntelCore';
import { WarRoom } from './components/WarRoom';
import { GrowthTools } from './components/GrowthTools';
import { ToolsPanel } from './components/ToolsPanel';
import { View } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>(View.INTEL);

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {currentView === View.INTEL && <IntelCore />}
      {currentView === View.WAR_ROOM && <WarRoom />}
      {currentView === View.GROWTH && <GrowthTools />}
      {currentView === View.TOOLS && <ToolsPanel />}
    </Layout>
  );
}

export default App;
