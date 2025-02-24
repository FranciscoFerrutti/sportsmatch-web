import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReservationModal } from './ReservationModal';
import { Reservation } from '@/types/reservation';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuth } from '@/context/AppContext';

dayjs.extend(utc);
dayjs.extend(timezone);

export const ReservationsView = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fields, setFields] = useState<Record<number, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();
  const apiKey = localStorage.getItem('c-api-key');

  useEffect(() => {
    const fetchReservationsAndFields = async () => {
      if (!apiKey || !clubId) {
        console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
        setLoading(false);
        return;
      }

      try {
        const [reservationsResponse, fieldsResponse] = await Promise.all([
          apiClient.get('/reservations', { headers: { 'c-api-key': apiKey } }),
          apiClient.get(`/fields`, {
            headers: { 'c-api-key': apiKey } ,
            params : { clubId }
          }),
        ]);

        console.log("✅ Reservas obtenidas:", reservationsResponse.data);
        console.log("✅ Canchas obtenidas:", fieldsResponse.data);

        setReservations(reservationsResponse.data);

        const fieldsMap: Record<number, string> = {};
        fieldsResponse.data.forEach((field: { id: number; name: string }) => {
          fieldsMap[field.id] = field.name;
        });

        console.log("🏟️ Mapeo de canchas generado:", fieldsMap);
        setFields(fieldsMap);
      } catch (error) {
        console.error("❌ Error al obtener reservas o canchas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationsAndFields();
  }, [clubId, apiKey]);

  const updateReservationStatus = async (reservationId: number, status: 'CONFIRMED' | 'CANCELLED') => {
    if (!apiKey) return;

    try {
      await apiClient.patch(`/reservations/${reservationId}/status`, { status }, { headers: { 'c-api-key': apiKey } });
      setReservations(prev =>
          prev.map(r => (r.id === reservationId ? { ...r, status } : r))
      );
    } catch (error) {
      alert(status === 'CONFIRMED'
          ? 'No se puede aceptar la reserva porque el horario ya no está disponible'
          : 'Error al rechazar la reserva'
      );
      console.error(`Error al cambiar el estado de la reserva (${status}):`, error);
    }
  };

  const handleAccept = (reservationId: number) => updateReservationStatus(reservationId, 'CONFIRMED');
  const handleReject = (reservationId: number) => updateReservationStatus(reservationId, 'CANCELLED');

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
            <h3 className="font-semibold text-lg mb-1">{fields[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
            <p className="text-gray-600">{dayjs(reservation.date).format('dddd, D [de] MMMM')}</p>
            <p className="text-gray-600">{reservation.time}hs</p>
          </div>
          <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
              reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
          }`}>
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

        {loading ? (
            <p className="text-center text-gray-500">Cargando reservas...</p>
        ) : (
            <>
              <section className="mb-8">
                <h2 className="text-lg font-medium mb-4">Reservas pendientes</h2>
                <div className="space-y-4">
                  {pendingReservations.length === 0 ? (
                      <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                  ) : (
                      pendingReservations.map(reservation => (
                          <ReservationCard key={reservation.id} reservation={reservation} showActions />
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
            </>
        )}

        <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
  );
};
