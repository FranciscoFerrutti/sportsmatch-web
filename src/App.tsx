// src/App.tsx
import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/Home/HomeView';
import { CourtsView } from './components/Courts/CourtsView';
import { NewCourtForm } from './components/Courts/NewCourtForm';
import CalendarView from './components/Calendar/CalendarView';
import { View } from './types/navigation';

function App() {
  const [currentView, setCurrentView] = useState<View>('inicio');

  const handleNewCourt = () => {
    setCurrentView('nueva-cancha');
  };

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <HomeView />;
      case 'mis-canchas':
        return <CourtsView onNewCourt={handleNewCourt} />;
      case 'calendario':
        return <CalendarView />;
      case 'nueva-cancha':
        return <NewCourtForm />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onViewChange={setCurrentView} currentView={currentView} />
      {renderView()}
    </div>
  );
}

export default App;