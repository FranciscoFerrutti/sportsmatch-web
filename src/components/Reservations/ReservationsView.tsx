// src/components/Reservations/ReservationsView.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCourts } from '@/context/CourtsContext';
import { ReservationModal } from './ReservationModal';
import type { ReservationStatus } from '@/context/CourtsContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

interface ReservationWithCourtName {
  id: number;
  courtId: number;
  courtName: string;
  date: string;
  time: string;
  status: ReservationStatus;
}

export const ReservationsView = () => {
  const { courts, updateReservationStatus } = useCourts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get all reservations with court names
  const allReservations: ReservationWithCourtName[] = courts.flatMap(court =>
    court.reservations.map(reservation => ({
      ...reservation,
      courtName: court.name
    }))
  );

  // Separate reservations by status
  const pendingReservations = allReservations
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingReservations = allReservations
    .filter(r => r.status === 'accepted' && new Date(`${r.date} ${r.time}`) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastReservations = allReservations
    .filter(r => r.status === 'accepted' && new Date(`${r.date} ${r.time}`) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Note: reversed sort for past

    const handleAccept = async (courtId: number, reservationId: number) => {
        console.log('Attempting to accept reservation:', { courtId, reservationId });
        
        const reservation = allReservations.find(
          r => r.courtId === courtId && r.id === reservationId
        );
        
        console.log('Found reservation:', reservation);
      
        const success = await updateReservationStatus(courtId, reservationId, 'accepted');
        
        if (!success) {
          const court = courts.find(c => c.id === courtId);
          console.log('Acceptance failed. Court data:', court);
          
          if (court && reservation) {
            const dayOfWeek = new Date(reservation.date)
              .toLocaleDateString('es-ES', { weekday: 'long' });
            const day = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
            
            console.log('Schedule check:', {
              day,
              schedule: court.schedule[day],
              reservation
            });
            
            alert(`No se pudo aceptar la reserva. Por favor, verifique la disponibilidad del horario.`);
          } else {
            alert('Error al procesar la reserva. Por favor, intente nuevamente.');
          }
        }
      };

  const handleReject = (courtId: number, reservationId: number) => {
    updateReservationStatus(courtId, reservationId, 'rejected');
  };

  const formatDate = (dateStr: string) => {
    dayjs.locale('es');
    dayjs.extend(utc);
    dayjs.extend(timezone);
    return dayjs.tz(dateStr, dayjs.tz.guess()).format('dddd, D [de] MMMM [de] YYYY');
  };

  const getStatusClass = (status: ReservationStatus) => {
    const classes = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status];
  };

  const getStatusText = (status: ReservationStatus) => {
    const texts = {
      'pending': 'Pendiente',
      'accepted': 'Aceptada',
      'rejected': 'Rechazada'
    };
    return texts[status];
  };

  const ReservationCard: React.FC<{
    reservation: ReservationWithCourtName;
    showActions?: boolean;
  }> = ({ reservation, showActions = false }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg mb-1">{reservation.courtName}</h3>
          <p className="text-gray-600">{formatDate(reservation.date)}</p>
          <p className="text-gray-600">{reservation.time}hs</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusClass(reservation.status)}`}>
            {getStatusText(reservation.status)}
          </span>
          {showActions && (
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => handleAccept(reservation.courtId, reservation.id)}
              >
                Aceptar
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => handleReject(reservation.courtId, reservation.id)}
              >
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Reservas</h1>
        <Button 
          className="bg-[#000066] hover:bg-[#000088]"
          onClick={() => setIsModalOpen(true)}
        >
          Nueva reserva
        </Button>
      </div>

      {/* Pending Reservations */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Reservas pendientes</h2>
        <div className="space-y-4">
          {pendingReservations.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No hay reservas pendientes
            </Card>
          ) : (
            pendingReservations.map(reservation => (
              <ReservationCard 
                key={`${reservation.courtId}-${reservation.id}`}
                reservation={reservation}
                showActions={true}
              />
            ))
          )}
        </div>
      </section>

      {/* Upcoming Reservations */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Próximas reservas</h2>
        <div className="space-y-4">
          {upcomingReservations.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No hay próximas reservas
            </Card>
          ) : (
            upcomingReservations.map(reservation => (
              <ReservationCard 
                key={`${reservation.courtId}-${reservation.id}`}
                reservation={reservation}
              />
            ))
          )}
        </div>
      </section>

      {/* Past Reservations */}
      <section>
        <h2 className="text-lg font-medium mb-4">Reservas pasadas</h2>
        <div className="space-y-4">
          {pastReservations.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No hay reservas pasadas
            </Card>
          ) : (
            pastReservations.map(reservation => (
              <ReservationCard 
                key={`${reservation.courtId}-${reservation.id}`}
                reservation={reservation}
              />
            ))
          )}
        </div>
      </section>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};