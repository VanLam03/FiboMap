import React from 'react';
import { Topbar } from './components/Topbar/Topbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { Timeline } from './components/Timeline/Timeline';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f172a]">
      {/* Top bar */}
      <Topbar />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Center: Map + Timeline stacked */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Map Preview */}
          <MapCanvas />

          {/* Timeline */}
          <Timeline />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>
    </div>
  );
}

export default App;
