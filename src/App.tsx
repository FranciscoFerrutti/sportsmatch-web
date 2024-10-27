// src/App.tsx
import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/Home/HomeView';
import { CourtsView } from './components/Courts/CourtsView';
import { NewCourtForm } from './components/Courts/NewCourtForm';
import { ModifyCourtForm } from './components/Courts/ModifyCourtForm';
import { ReservationsView } from './components/Reservations/ReservationsView'; // Added this import
import CalendarView from './components/Calendar/CalendarView';
import { View } from './types/navigation';
import { CourtsProvider } from './context/CourtsContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<View>('inicio');
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleViewChange = (newView: View) => {
    if (hasUnsavedChanges && (currentView === 'nueva-cancha' || currentView === 'modificar-cancha')) {
      if (window.confirm('Hay cambios sin guardar. ¿Desea salir de todas formas?')) {
        setHasUnsavedChanges(false);
        setCurrentView(newView);
      }
    } else {
      setCurrentView(newView);
    }
  };

  const handleNewCourt = () => {
    setHasUnsavedChanges(false);
    setCurrentView('nueva-cancha');
  };

  const handleModifyCourt = (courtId: number) => {
    setHasUnsavedChanges(false);
    setSelectedCourtId(courtId);
    setCurrentView('modificar-cancha');
  };

  const handleCourtSuccess = () => {
    setHasUnsavedChanges(false);
    setCurrentView('mis-canchas');
    setSelectedCourtId(null);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Hay cambios sin guardar. ¿Desea volver atrás?')) {
        setHasUnsavedChanges(false);
        setCurrentView('mis-canchas');
        setSelectedCourtId(null);
      }
    } else {
      setCurrentView('mis-canchas');
      setSelectedCourtId(null);
    }
  };

  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <HomeView />;
      case 'mis-canchas':
        return <CourtsView 
          onNewCourt={handleNewCourt} 
          onModifyCourt={handleModifyCourt}
        />;
      case 'reservas': // Added this case
        return <ReservationsView />;
      case 'calendario':
        return <CalendarView />;
      case 'nueva-cancha':
        return (
          <div>
            <div className="p-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <NewCourtForm 
              onSuccess={handleCourtSuccess} 
              onFormChange={handleFormChange}
            />
          </div>
        );
      case 'modificar-cancha':
        return selectedCourtId ? (
          <div>
            <div className="p-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <ModifyCourtForm 
              courtId={selectedCourtId} 
              onSuccess={handleCourtSuccess}
              onFormChange={handleFormChange}
            />
          </div>
        ) : null;
      default:
        return <HomeView />;
    }
  };

  return (
    <CourtsProvider>
      <div className="min-h-screen bg-slate-50">
        <Navigation onViewChange={handleViewChange} currentView={currentView} />
        <main className="bg-slate-50 min-h-[calc(100vh-64px)] transition-all duration-300">
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            renderView()
          )}
        </main>
      </div>
    </CourtsProvider>
  );
}

export default App;