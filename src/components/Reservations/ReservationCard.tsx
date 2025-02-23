import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useFields } from '@/context/FieldsContext';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ReservationCardProps {
    reservation: {
        id: number;
        fieldId: number;
        fieldName: string;
        date: string;
        time: string;
        status: string;
    };
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ reservation }) => {
    const { cancelReservation } = useFields();

    // Intenta formatear la fecha correctamente
    let formattedDate;
    try {
        formattedDate = reservation.date
            ? dayjs.utc(reservation.date).tz(dayjs.tz.guess()).format('dddd, D [de] MMMM [de] YYYY')
            : 'Fecha no disponible';
    } catch (error) {
        console.error('Error formateando la fecha:', error);
        formattedDate = 'Fecha no disponible';
    }

    console.log('Fecha original:', reservation.date);
    console.log('Fecha formateada:', formattedDate);

    const handleCancel = () => {
        cancelReservation(reservation.fieldId, reservation.id);
    };

    return (
        <div className="reservation-card border p-4 rounded-lg shadow-md">
            <h2 className="font-semibold">{reservation.fieldName}</h2>
            <p>{formattedDate}</p>
            <p>{reservation.time}hs</p>
            <p className="text-gray-500">
                {reservation.status === 'accepted' ? 'Aceptada' : reservation.status}
            </p>

            <button
                onClick={handleCancel}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Cancelar reserva
            </button>
        </div>
    );
};
