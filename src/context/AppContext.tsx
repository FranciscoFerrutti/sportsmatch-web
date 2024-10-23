import React, { createContext, useContext, useState, useEffect } from 'react';
import { Court, Reservation } from '@/types';

type AppContextType = {
  courts: Court[];
  setCourts: (courts: Court[]) => void;
  reservations: Reservation[];
  setReservations: (reservations: Reservation[]) => void;
  loading: boolean;
  error: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        // Fetch initial data
        // await Promise.all([fetchCourts(), fetchReservations()]);
      } catch (err) {
        setError('Error loading initial data');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <AppContext.Provider
      value={{
        courts,
        setCourts,
        reservations,
        setReservations,
        loading,
        error
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};