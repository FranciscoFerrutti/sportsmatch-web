import { useState, useEffect } from 'react';
import { Court } from '@/types';

export const useCourts = () => {
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    setCourts([
      { id: 1, name: "Cancha 1", sport: "Tenis" },
      { id: 2, name: "Cancha 2", sport: "Tenis" },
      { id: 3, name: "Cancha 3", sport: "Tenis" },
      { id: 4, name: "Cancha 4", sport: "Fútbol" },
      { id: 5, name: "Cancha 5", sport: "Fútbol" },
      { id: 6, name: "Cancha 6", sport: "Padel" }
    ]);
  }, []);

  const handleModifyCourt = (id: number) => {
    console.log('Modifying court:', id);
  };

  return { courts, handleModifyCourt };
};
