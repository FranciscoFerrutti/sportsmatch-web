import { useState, useEffect } from 'react';
import { TimeSlot } from '@/types';

export const useCalendar = () => {
  const [selectedCourt, setSelectedCourt] = useState<number>(1);
  const [timeSlots] = useState<Record<string, TimeSlot>>({});
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  useEffect(() => {
  }, [selectedCourt]);

  const handleCourtChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourt(Number(event.target.value));
  };

  return {
    selectedCourt,
    courts: [], 
    timeSlots,
    days,
    hours,
    handleCourtChange
  };
};
