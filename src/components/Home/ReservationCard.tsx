// src/components/Reservations/ReservationCard.tsx
import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone';
import { useCourts } from '@/context/CourtsContext';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ReservationCardProps {
  reservation: {
    id: number;
    courtId: number;
    courtName: string;
    date: string;
    time: string;
    status: string;
  };
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ reservation }) => {
  const { cancelReservation } = useCourts();

  // Formatea la fecha en la zona horaria local
  const formattedDate = dayjs.tz(reservation.date, dayjs.tz.guess()).format('dddd, D [de] MMMM [de] YYYY');
  console.log('Fecha guardada en reserva:', reservation.date);
  console.log('Fecha formateada para mostrar (formattedDate):', formattedDate);

  const handleCancel = () => {
    cancelReservation(reservation.courtId, reservation.id);
  };

  return (
    <div className="reservation-card border p-4 rounded-lg shadow-md">
      <h2 className="font-semibold">{reservation.courtName}</h2>
      <p>{formattedDate}</p>
      <p>{reservation.time}hs</p>
      <p className="text-gray-500">
        {reservation.status === 'accepted' ? 'Aceptada' : reservation.status}
      </p>

      {/* Show "Cancelar reserva" button only if the reservation is accepted */}
      <button
          onClick={handleCancel}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cancelar reserva
        </button>
    </div>
  );
};
