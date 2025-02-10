import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReservationModal } from './ReservationModal';
import { Reservation } from '@/types/reservation';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const ReservationsView = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      const apiKey = localStorage.getItem('c-api-key');

      if (!apiKey) {
        console.error('Error: API Key no encontrada en localStorage');
        return;
      }

      try {
        const response = await apiClient.get('/reservations', {
          headers: { 'c-api-key': apiKey },
        });
        setReservations(response.data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();
  }, []);

  const handleAccept = async (reservationId: number) => {
    try {
      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: 'CONFIRMED',
      });
      setReservations(prev =>
          prev.map(r => (r.id === reservationId ? { ...r, status: 'CONFIRMED' } : r))
      );
    } catch (error) {
      alert('No se puede aceptar la reserva porque el horario ya no está disponible');
      console.error('Error al aceptar la reserva:', error);
    }
  };

  const handleReject = async (reservationId: number) => {
    try {
      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: 'CANCELLED',
      });
      setReservations(prev =>
          prev.map(r => (r.id === reservationId ? { ...r, status: 'CANCELLED' } : r))
      );
    } catch (error) {
      console.error('Error al rechazar la reserva:', error);
    }
  };

  const pendingReservations = reservations
      .filter(r => r.status === 'PENDING')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingReservations = reservations
      .filter(r => r.status === 'CONFIRMED' && new Date(`${r.date} ${r.time}`) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastReservations = reservations
      .filter(r => r.status === 'CONFIRMED' && new Date(`${r.date} ${r.time}`) < new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ReservationCard: React.FC<{ reservation: Reservation; showActions?: boolean }> = ({ reservation, showActions = false }) => (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg mb-1">{`Cancha ${reservation.courtId}`}</h3>
            <p className="text-gray-600">{dayjs(reservation.date).format('dddd, D [de] MMMM')}</p>
            <p className="text-gray-600">{reservation.time}hs</p>
          </div>
          <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {reservation.status === 'PENDING' ? 'Pendiente' : reservation.status === 'CONFIRMED' ? 'Aceptada' : 'Rechazada'}
          </span>
            {showActions && (
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleAccept(reservation.id)}>
                    Aceptar
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleReject(reservation.id)}>
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
          <Button className="bg-[#000066] hover:bg-[#000088]" onClick={() => setIsModalOpen(true)}>Nueva reserva</Button>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Reservas pendientes</h2>
          <div className="space-y-4">
            {pendingReservations.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
            ) : (
                pendingReservations.map(reservation => (
                    <ReservationCard key={reservation.id} reservation={reservation} showActions={true} />
                ))
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-4">Próximas reservas</h2>
          <div className="space-y-4">
            {upcomingReservations.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No hay próximas reservas</Card>
            ) : (
                upcomingReservations.map(reservation => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">Reservas pasadas</h2>
          <div className="space-y-4">
            {pastReservations.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No hay reservas pasadas</Card>
            ) : (
                pastReservations.map(reservation => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                ))
            )}
          </div>
        </section>

        <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
  );
};
