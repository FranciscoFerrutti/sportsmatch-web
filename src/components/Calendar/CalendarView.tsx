// src/components/Calendar/CalendarView.tsx
import React, { useState } from 'react';
import { Select } from '@/components/ui/select';
import { useCourts } from '@/context/CourtsContext';

type TimeSlotStatus = 'Disponible' | 'Ocupado' | 'Pendiente' | 'No disponible';

const CalendarView = () => {
  const { courts } = useCourts();
  const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id.toString() || '');
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

  const selectedCourtData = courts.find(court => court.id.toString() === selectedCourt);

  const getWeekDayDate = (day: string) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysMap: Record<string, number> = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6
    };

    let targetDay = daysMap[day];
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
  };

  const getTimeSlotStatus = (day: string, hour: number): TimeSlotStatus => {
    if (!selectedCourtData) return 'No disponible';

    const schedule = selectedCourtData.schedule[day];
    if (!schedule || schedule.closed) return 'No disponible';

    const currentTime = `${hour.toString().padStart(2, '0')}:00`;
    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);

    if (hour < startHour || hour >= endHour) return 'No disponible';

    const dateString = getWeekDayDate(day);

    // Check if there's an accepted reservation for this slot
    const isOccupied = selectedCourtData.reservations.some(
      reservation =>
        reservation.status === 'accepted' &&
        reservation.date === dateString &&
        reservation.time === currentTime
    );

    return isOccupied ? 'Ocupado' : 'Disponible';
  };

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
          {courts.map(court => (
            <option key={court.id} value={court.id.toString()}>
              {court.name} - {court.sport}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
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
                <td className="border p-2 text-center font-medium">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </td>
                {days.map(day => {
                  const status = getTimeSlotStatus(day, hour);
                  return (
                    <td key={`${day}-${hour}`} className="border p-2">
                      <div 
                        className={`text-center p-1 rounded ${getStatusClass(status)}`}
                        title={status === 'No disponible' ? 'Fuera de horario' : status}
                      >
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

      {selectedCourtData && (
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Horarios de la cancha:</p>
          {Object.entries(selectedCourtData.schedule).map(([day, schedule]) => (
            <p key={day} className="mb-1">
              {day}: {schedule.closed ? 'Cerrado' : `${schedule.start} - ${schedule.end}`}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarView;