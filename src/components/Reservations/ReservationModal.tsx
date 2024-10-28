import React, { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourts } from '@/context/CourtsContext';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const { courts, addReservation } = useCourts();
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedCourtData = courts.find(court => court.id.toString() === selectedCourt);

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  const getAvailableTimes = () => {
    if (!selectedCourtData || !selectedDate) return [];

    const dayOfWeek = dayjs(selectedDate).locale('es').format('dddd');
    const day = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

    const schedule = selectedCourtData.schedule[day];
    if (!schedule || schedule.closed) return [];

    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);
    const times: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      const isReserved = selectedCourtData.reservations.some(
        reservation =>
          reservation.date === selectedDate &&
          reservation.time === timeString &&
          reservation.status === 'accepted'
      );

      const isBlocked = selectedCourtData.slotStatuses.some(
        slot =>
          slot.date === selectedDate &&
          slot.time === timeString &&
          (slot.status === 'Ocupado' || slot.status === 'No disponible')
      );

      if (!isReserved && !isBlocked) {
        times.push(timeString);
      }
    }

    return times;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const localDate = dayjs(date).tz(dayjs.tz.guess()); 
    setSelectedDate(localDate.format('YYYY-MM-DD'));
    setFormattedDate(localDate.locale('es').format('dddd, D [de] MMMM [de] YYYY'));
    setSelectedTime(''); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourt && selectedDate && selectedTime) {
      const localDate = dayjs.tz(selectedDate, 'YYYY-MM-DD', dayjs.tz.guess()).format('YYYY-MM-DD'); 
      const localTime = dayjs(`${selectedDate}T${selectedTime}`).format('HH:mm');
  
      console.log('Fecha seleccionada:', selectedDate); 
      console.log('Fecha formateada en local (localDate):', localDate);
      console.log('Hora formateada en local (localTime):', localTime);
  
      addReservation(parseInt(selectedCourt), localDate, localTime);
      onClose();
      setSelectedCourt('');
      setSelectedDate('');
      setSelectedTime('');
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Nueva Reserva</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Cancha:</label>
            <select
              value={selectedCourt}
              onChange={(e) => {
                setSelectedCourt(e.target.value);
                setSelectedTime(''); 
              }}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Seleccionar cancha</option>
              {courts.map(court => (
                <option key={court.id} value={court.id.toString()}>
                  {court.name} - {court.sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={minDate}
              max={maxDate}
              className="w-full p-2 border rounded"
              required
            />
            {formattedDate && (
              <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Horario:</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!selectedCourt || !selectedDate}
              required
            >
              <option value="">Seleccionar horario</option>
              {getAvailableTimes().map(time => (
                <option key={time} value={time}>{time}hs</option>
              ))}
            </select>
            {selectedCourt && selectedDate && getAvailableTimes().length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No hay horarios disponibles para esta fecha
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-[#000066] hover:bg-[#000088]" disabled={!selectedCourt || !selectedDate || !selectedTime}>
              Crear reserva
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
