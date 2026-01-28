import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { IntelCore } from './components/IntelCore';
import { WarRoom } from './components/WarRoom';
import { GrowthTools } from './components/GrowthTools';
import { ToolsPanel } from './components/ToolsPanel';
import { View, XProfile } from './types';

function App() {
  const [currentView, setCurrentView] = useState<View>(View.INTEL);
  const [userProfile, setUserProfile] = useState<XProfile | null>(null);

  // Restore session on mount
  useEffect(() => {
    try {
        const savedHandle = localStorage.getItem('gistfi_x_handle');
        const savedProfileStr = localStorage.getItem('gistfi_x_profile');
        
        if (savedHandle && savedProfileStr) {
            setUserProfile(JSON.parse(savedProfileStr));
        } else if (savedHandle) {
            // Fallback if only handle exists (legacy)
             setUserProfile({ 
                handle: savedHandle, 
                name: 'Returning User', 
                bio: 'Crypto native', 
                followers: '---', 
                following: '---', 
                avatar: '', 
                alphaScore: 50 
             });
        }
    } catch (e) {
        console.error("Session restore failed", e);
    }
  }, []);

  const handleLogin = (profile: XProfile) => {
      setUserProfile(profile);
      localStorage.setItem('gistfi_x_handle', profile.handle);
      localStorage.setItem('gistfi_x_profile', JSON.stringify(profile));
  };

  const handleLogout = () => {
      setUserProfile(null);
      localStorage.removeItem('gistfi_x_handle');
      localStorage.removeItem('gistfi_x_profile');
      setCurrentView(View.INTEL);
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView} user={userProfile} onLogout={handleLogout}>
      {currentView === View.INTEL && <IntelCore user={userProfile} onLogin={handleLogin} />}
      {currentView === View.WAR_ROOM && <WarRoom />}
      {currentView === View.GROWTH && <GrowthTools />}
      {currentView === View.TOOLS && <ToolsPanel />}
    </Layout>
  );
}

export default App;