import { useState, useEffect } from 'react';
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
dayjs.locale('es');

export const ReservationsView = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fields, setFields] = useState<Record<number, string>>({});
  const [users, setUsers] = useState<Record<number, { name: string; phone: string }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();
  const apiKey = localStorage.getItem('c-api-key');

  const fetchReservationsAndFields = async () => {
    if (!apiKey || !clubId) {
      console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
      setLoading(false);
      return;
    }
    try {
      const [reservationsResponse, fieldsResponse] = await Promise.all([
        apiClient.get(`/reservations`, { headers: { 'c-api-key': apiKey } }),
        apiClient.get('/fields', {
          headers: { 'c-api-key': apiKey },
          params: { clubId },
        }),
      ]);

      setReservations(reservationsResponse.data);

      const fieldsMap: Record<number, string> = {};
      fieldsResponse.data.forEach((field: { id: number; name: string }) => {
        fieldsMap[field.id] = field.name;
      });

      setFields(fieldsMap);

      fetchUsersForReservations(reservationsResponse.data);
    } catch (error) {
      console.error('❌ Error al obtener reservas o canchas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForReservations = async (reservations: Reservation[]) => {
    const usersMap: Record<number, { name: string; phone: string }> = {};
    const updatedReservations = [...reservations]; // Copia de reservas para actualizar

    try {
      const reservationRequests = reservations.map(reservation =>
          apiClient.get(`/reservations/${reservation.id}`, { headers: { 'c-api-key': apiKey } })
      );

      const reservationResponses = await Promise.all(reservationRequests);

      for (let i = 0; i < reservationResponses.length; i++) {
        const res = reservationResponses[i];
        const reservation = reservations[i];
        const detailedReservation = res.data;

        if (!detailedReservation || !detailedReservation.event) continue;

        const userId = detailedReservation.event.ownerId;
        const organizerType = detailedReservation.event.organizerType;

        updatedReservations[i] = { ...reservation, ownerId: userId };

        if (userId && !usersMap[userId]) {
          let userResponse;

          if (organizerType === "user") {
            userResponse = await apiClient.get(`/users/${userId}`, { headers: { 'c-api-key': apiKey } });
          } else if (organizerType === "club") {
            userResponse = await apiClient.get(`/clubs/${userId}`, { headers: { 'c-api-key': apiKey } });
          }

          if (userResponse) {
            usersMap[userId] = {
              name: userResponse.data.firstName
                  ? `${userResponse.data.firstName} ${userResponse.data.lastName}`
                  : userResponse.data.name,
              phone: userResponse.data.phoneNumber || userResponse.data.phone || 'Sin teléfono',
            };
          }
        }
      }

      setReservations(updatedReservations); // 🔄 Actualizamos reservas con ownerId
      setUsers(prevUsers => ({ ...prevUsers, ...usersMap })); // 🔄 Merge con usuarios previos
    } catch (error) {
      console.error("❌ Error al obtener datos de usuarios:", error);
    }
  };


  useEffect(() => {
    fetchReservationsAndFields();
  }, [clubId, apiKey]);

  const handleDeleteReservation = async (reservationId: number) => {
    if (!apiKey) return;
    console.log(`🗑️ Eliminando reserva ID: ${reservationId}`);
    try {
      await apiClient.delete(`/reservations/${reservationId}`, {
        headers: { 'c-api-key': apiKey },
      });
      setReservations(prev => prev.filter(r => r.id !== reservationId));
      console.log(`✅ Reserva ID: ${reservationId} eliminada correctamente.`);
    } catch (error) {
      console.error('❌ Error al eliminar la reserva:', error);
      alert('No se pudo eliminar la reserva.');
    }
  };

  const handleAccept = async (reservationId: number) => {
    try {
      if (!apiKey) {
        console.error('Error: API Key no encontrada en localStorage');
        return;
      }

      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: 'confirmed'
      }, {
        headers: { 'c-api-key': apiKey },
      });

      console.log(`✅ Reserva ID ${reservationId} aceptada.`);
      fetchReservationsAndFields();
    } catch (error) {
      console.error('❌ Error al aceptar la reserva:', error);
      alert('No se pudo aceptar la reserva.');
    }
  };

  const handleReject = async (reservationId: number) => {
    try {
      if (!apiKey) {
        console.error('Error: API Key no encontrada en localStorage');
        return;
      }

      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: 'cancelled'
      }, {
        headers: { 'c-api-key': apiKey },
      });

      console.log(`❌ Reserva ID ${reservationId} rechazada.`);
      fetchReservationsAndFields();
    } catch (error) {
      console.error('Error al rechazar la reserva:', error);
      alert('No se pudo rechazar la reserva.');
    }
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).locale('es').format('dddd D [de] MMMM [de] YYYY')
        .replace(/^./, match => match.toUpperCase());
  };

  const formatTime = (time?: string) => time ? time.slice(0, 5) : "Hora no disponible";

  const now = dayjs();

  const pendingReservations = reservations.filter(r => r.status === 'pending');

  const upcomingReservations = reservations.filter(r => {
    if (!r.timeSlots || r.timeSlots.length === 0) {
      return false;
    }
    return r.status === 'confirmed' && dayjs(`${r.timeSlots[0].date} ${r.timeSlots[0].startTime}`).isAfter(now);
  });

  const pastReservations = reservations.filter(r => {
    if (!r.timeSlots || r.timeSlots.length === 0) return false;
    return r.status === 'confirmed' && dayjs(`${r.timeSlots[0].date} ${r.timeSlots[0].startTime}`).isBefore(now);
  });

  const isToday = (dateStr: string) => {
    const today = dayjs().startOf('day'); // Tomar el inicio del día actual
    const givenDate = dayjs(dateStr).startOf('day'); // Convertir la fecha de la reserva
    return today.isSame(givenDate, 'day');
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = dayjs().add(1, 'day').startOf('day'); // Tomar el inicio del día siguiente
    const givenDate = dayjs(dateStr).startOf('day'); // Convertir la fecha de la reserva
    return tomorrow.isSame(givenDate, 'day');
  };

  const getRelativeDate = (reservation: Reservation) => {
    if (!reservation || !reservation.timeSlots || reservation.timeSlots.length === 0) {
      return "Fecha no disponible";
    }

    // Usar la fecha correcta de `timeSlots[0].date`
    const dateStr = reservation.timeSlots[0].date ;

    if (!dateStr) return "Fecha no disponible";

    if (isToday(dateStr)) return 'Hoy';
    if (isTomorrow(dateStr)) return 'Mañana';
    return formatDate(dateStr);
  };

  return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-6">Reservas</h1>

        {loading ? (
            <p className="text-center text-gray-500">Cargando reservas...</p>
        ) : (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Reservas pendientes de aprobación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReservations.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                      </div>
                  ) : (
                      pendingReservations.map((reservation : Reservation) => (
                          <Card key={`reservation-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{fields[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
                                <div className="space-y-1">
                                  <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                                  <p className="text-gray-600">
                                    {reservation.timeSlots && reservation.timeSlots.length > 0
                                        ? formatTime(reservation.timeSlots[0].startTime) + " hs"
                                        : "Hora no disponible"}
                                  </p>
                                  <div className=" border-gray-300 mt-2 pt-2 text-right">
                                    <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">{reservation.ownerId ? users[reservation.ownerId]?.name || 'Desconocido' : 'Desconocido'}</p>
                                    <p className="text-gray-600">
                                      {reservation.ownerId && users[reservation.ownerId]?.phone ? (
                                          <a
                                              href={`https://api.whatsapp.com/send?phone=${users[reservation.ownerId]?.phone.replace('+', '')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-800 underline hover:text-blue-800"
                                          >
                                            Enviar mensaje
                                          </a>
                                      ) : 'Sin teléfono'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={() => handleAccept(reservation.id)}>
                                  Aceptar
                                </Button>
                                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => handleReject(reservation.id)}>
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          </Card>
                      ))
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium mb-4">Próximas reservas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingReservations.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="p-6 text-center text-gray-500">No hay próximas reservas</Card>
                      </div>
                  ) : (
                      upcomingReservations.map((reservation: Reservation) => (
                          <Card key={`confirmed-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-lg mb-1">{fields[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
                            <div className="space-y-1">
                              <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                              <p className="text-gray-600">
                                {reservation.timeSlots && reservation.timeSlots.length > 0
                                    ? formatTime(reservation.timeSlots[0].startTime) + " hs"
                                    : "Hora no disponible"}
                              </p>
                              <div className=" border-gray-300 mt-2 pt-2 text-right">
                                <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">{reservation.ownerId ? users[reservation.ownerId]?.name || 'Desconocido' : 'Desconocido'}</p>
                                <p className="text-gray-600">
                                  {reservation.ownerId && users[reservation.ownerId]?.phone ? (
                                      <a
                                          href={`https://api.whatsapp.com/send?phone=${users[reservation.ownerId]?.phone.replace('+', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-800 underline hover:text-blue-800"
                                      >
                                        Enviar mensaje
                                      </a>
                                  ) : 'Sin teléfono'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={() => handleDeleteReservation(reservation.id)}>
                                Cancelar reserva
                              </Button>
                            </div>
                          </Card>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium mb-4">Reservas pasadas</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pastReservations.length === 0 ? (
                    <div className="col-span-full">
                      <Card className="p-6 text-center text-gray-500">No hay reservas pasadas</Card>
                    </div>
                    ) : (
                        pastReservations.map((reservation: Reservation) => (
                          <Card key={`past-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-lg mb-1">{fields[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
                            <div className="space-y-1">
                              <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                              <p className="text-gray-600">
                                {reservation.timeSlots && reservation.timeSlots.length > 0
                                    ? formatTime(reservation.timeSlots[0].startTime) + " hs"
                                    : "Hora no disponible"}
                              </p>
                              <div className=" border-gray-300 mt-2 pt-2 text-right">
                                <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">{reservation.ownerId ? users[reservation.ownerId]?.name || 'Desconocido' : 'Desconocido'}</p>
                                <p className="text-gray-600">
                                  {reservation.ownerId && users[reservation.ownerId]?.phone ? (
                                      <a
                                          href={`https://api.whatsapp.com/send?phone=${users[reservation.ownerId]?.phone.replace('+', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-800 underline hover:text-blue-800"
                                      >
                                        Enviar mensaje
                                      </a>
                                  ) : 'Sin teléfono'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                    )}
                  </div>
              </div>
            </>
        )}
        <ReservationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
      </div>
  );
};
