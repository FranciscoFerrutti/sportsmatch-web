// src/components/Reservations/ReservationModal.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourts } from '@/context/CourtsContext';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const { courts, addReservation } = useCourts();
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  if (!isOpen) return null;

  const selectedCourtData = courts.find(court => court.id.toString() === selectedCourt);

  // Get tomorrow's date as minimum date for reservations
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get date 30 days from now as maximum date
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const getAvailableTimes = () => {
    if (!selectedCourtData || !selectedDate) return [];

    const dayOfWeek = new Date(selectedDate)
      .toLocaleDateString('es-ES', { weekday: 'long' });

    // Capitalize first letter to match court schedule keys
    const day = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    
    const schedule = selectedCourtData.schedule[day];
    if (!schedule || schedule.closed) return [];

    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);
    const times: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      // Check if this time slot is already taken
      const isReserved = selectedCourtData.reservations.some(
        reservation => 
          reservation.date === selectedDate && 
          reservation.time === timeString &&
          reservation.status === 'accepted'
      );

      // Check if this time slot is manually blocked
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourt && selectedDate && selectedTime) {
      addReservation(parseInt(selectedCourt), selectedDate, selectedTime);
      onClose();
      // Reset form
      setSelectedCourt('');
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                setSelectedTime(''); // Reset time when court changes
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
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(''); // Reset time when date changes
              }}
              min={minDate}
              max={maxDateStr}
              className="w-full p-2 border rounded"
              required
            />
            {selectedDate && (
              <p className="text-sm text-gray-500 mt-1">
                {formatDateForDisplay(selectedDate)}
              </p>
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

          {/* Schedule information */}
          {selectedCourtData && selectedDate && (
            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
              <p>Horario de la cancha para {
                new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' })
              }:</p>
              <p>{
                selectedCourtData.schedule[
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' })
                  .charAt(0).toUpperCase() + 
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' }).slice(1)
                ]?.closed ? 'Cerrado' : 
                `${selectedCourtData.schedule[
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' })
                  .charAt(0).toUpperCase() + 
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' }).slice(1)
                ]?.start} - ${selectedCourtData.schedule[
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' })
                  .charAt(0).toUpperCase() + 
                  new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long' }).slice(1)
                ]?.end}`
              }</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#000066] hover:bg-[#000088]"
              disabled={!selectedCourt || !selectedDate || !selectedTime}
            >
              Crear reserva
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};