import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types';

export const useCalendar = () => {
  const [selectedField, setSelectedField] = useState<number>(1);
  const [timeSlots] = useState<Record<string, TimeSlot>>({});
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  useEffect(() => {
  }, [selectedField]);

  const handleFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedField(Number(event.target.value));
  };

  return {
    selectedField,
    fields: [],
    timeSlots,
    days,
    hours,
    handleFieldChange
  };
};
