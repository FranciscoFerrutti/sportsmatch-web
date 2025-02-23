import { useState, useEffect } from 'react';
import { Field } from '@/types';

export const useFields = () => {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    setFields([
      { id: 1, name: "Cancha 1", sport: "Tenis" },
      { id: 2, name: "Cancha 2", sport: "Tenis" },
      { id: 3, name: "Cancha 3", sport: "Tenis" },
      { id: 4, name: "Cancha 4", sport: "Fútbol" },
      { id: 5, name: "Cancha 5", sport: "Fútbol" },
      { id: 6, name: "Cancha 6", sport: "Padel" }
    ]);
  }, []);

  const handleModifyField = (id: number) => {
    console.log('Modifying field:', id);
  };

  return { fields, handleModifyField };
};
