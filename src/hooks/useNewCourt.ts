import { useState } from 'react';

export const useNewCourt = () => {
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    material: '',
    covered: false,
    price: '',
    schedule: {} as Record<string, { start: string; end: string; closed: boolean }>
  });

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };

  const handleScheduleChange = (day: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // API call to save court
      console.log('Saving court:', formData);
    } catch (error) {
      console.error('Error saving court:', error);
    }
  };

  return {
    formData,
    days,
    handleInputChange,
    handleScheduleChange,
    handleSubmit
  };
};