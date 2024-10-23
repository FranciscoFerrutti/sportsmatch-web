// src/components/Calendar/CalendarView.tsx
import React, { useState } from 'react';
import { Select } from '@/components/ui/select';

type TimeSlotStatus = 'Disponible' | 'Ocupado' | 'Pendiente' | 'No disponible';

const CalendarView = () => {
  const [selectedCourt, setSelectedCourt] = useState('1');
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

  const getStatusClass = (status: TimeSlotStatus) => {
    const classes = {
      'Disponible': 'bg-green-100 text-green-800',
      'Ocupado': 'bg-red-100 text-red-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'No disponible': 'bg-gray-100 text-gray-800'
    };
    return classes[status];
  };

  return (
    <div className="p-6">
      <h1 className="text-xl mb-6">Calendario semanal</h1>
      
      <div className="mb-4">
        <Select
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
          className="w-48"
        >
          <option value="1">Cancha 1</option>
          <option value="2">Cancha 2</option>
          <option value="3">Cancha 3</option>
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50">Hora</th>
              {days.map(day => (
                <th key={day} className="border p-2 bg-gray-50">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="border p-2 text-center">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </td>
                {days.map(day => {
                  const status: TimeSlotStatus = 'Disponible'; // You can make this dynamic
                  return (
                    <td key={`${day}-${hour}`} className="border p-2">
                      <div className={`text-center p-1 rounded ${getStatusClass(status)}`}>
                        {status}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarView;