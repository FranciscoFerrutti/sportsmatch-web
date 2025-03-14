import { useState, useEffect } from 'react';
import { Reservation } from '@/types/reservation';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuth } from '@/context/AppContext';
import {UserCircle, Calendar, Clock, Users, BookOpen, Hourglass } from "lucide-react";
import styles from './Reservations.module.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const ReservationsView = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const {clubId} = useAuth();
  const apiKey = localStorage.getItem('c-api-key');

  const fetchReservations = async () => {
    if (!apiKey || !clubId) {
      console.error('🚨 Error: Falta API Key o clubId', {apiKey, clubId});
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/reservations`, {headers: {'c-api-key': apiKey}});
      const reservationsList = response.data

      const detailedReservations = await Promise.all(
        reservationsList.map(async (reservation: any) => {
            try {
                const detailsResponse = await apiClient.get(`/reservations/${reservation.id}`, {
                    headers: { 'c-api-key': apiKey }
                });

                return {
                    ...detailsResponse.data,
                    field: {
                        id: detailsResponse.data.field?.id,
                        name: detailsResponse.data.field?.name,
                        cost: detailsResponse.data.field?.cost || 0,
                        description: detailsResponse.data.field?.description || '',
                        capacity: detailsResponse.data.field?.capacity || 0,
                        slot_duration: detailsResponse.data.field?.slot_duration || 0,
                        clubName: detailsResponse.data.field?.club?.name || "Desconocido"
                    },
                    timeSlot: reservation.timeSlots[0],
                    event: {
                        id: detailsResponse.data.event?.id,
                        ownerId: detailsResponse.data.event?.ownerId,
                        organizerType: detailsResponse.data.event?.organizerType || 'user',
                        schedule: detailsResponse.data.event?.schedule || '',
                        ownerName: detailsResponse.data.event?.userOwner
                            ? `${detailsResponse.data.event.userOwner.firstname} ${detailsResponse.data.event.userOwner.lastname}`
                            : 'Desconocido',
                        ownerPhone: detailsResponse.data.event?.userOwner?.phone_number || 'Sin teléfono',
                        ownerImage: detailsResponse.data.event?.userOwner?.image_url || null
                    }
                };
            } catch (error) {
                console.error(`❌ Error al obtener detalles de reserva ${reservation.id}:`, error);
                return reservation; // Devolvemos la reserva original en caso de error
            }
        })
    );

      setReservations(detailedReservations);
    } catch (error) {
      console.error('❌ Error al obtener reservas:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReservations();
  }, [clubId, apiKey]);

  const handleDeleteReservation = async (reservationId: number) => {
    if (!apiKey) return;
    try {
      await apiClient.delete(`/reservations/${reservationId}`, {
        headers: {'c-api-key': apiKey},
      });
      setReservations(prev => prev.filter(r => r.id !== reservationId));
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
        headers: {'c-api-key': apiKey},
      });

      fetchReservations();
    } catch (error) {
      console.error('Error al aceptar la reserva:', error);
      alert('No se pudo aceptar la reserva.');
    }
  };

  const handleReject = async (reservationId: number) => {
    try {
      if (!apiKey) {
        console.error('Error: API Key no encontrada en localStorage');
        return;
      }

      await apiClient.delete(`/reservations/${reservationId}`, {
        headers: {'c-api-key': apiKey,
          'x-auth-type': 'club'
        },
      });

      fetchReservations();
    } catch (error) {
      console.error('Error al rechazar la reserva:', error);
      alert('No se pudo rechazar la reserva.');
    }
  };

  const isDateCurrentOrFuture = (dateString: string | undefined) => {
    if (!dateString) return false;
    const today = dayjs().startOf('day');
    const date = dayjs(dateString).startOf('day');
    return date.isSame(today, 'day') || date.isAfter(today);
  };


    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Reservas</h1>
            </div>

            {loading ? (
                <div className={styles.loadingSpinner}>
                    <p className={styles.loadingText}>Cargando reservas</p>
                </div>
            ) : (
                <div className="mx-auto space-y-12">

                    {/* 🔹 Reservas Pendientes */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <BookOpen className={`${styles.sectionIcon} text-[#000066]`} />
                            Reservas Pendientes
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r => r.status === 'pending' && isDateCurrentOrFuture(r.timeSlot?.availabilityDate)).length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas pendientes</div>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'pending' && isDateCurrentOrFuture(r.timeSlot?.availabilityDate))
                                    .sort((a, b) =>
                                        dayjs(a.timeSlot?.availabilityDate).valueOf() -
                                        dayjs(b.timeSlot?.availabilityDate).valueOf() ||
                                        dayjs(`2000-01-01T${a.timeSlot?.startTime}`).valueOf() -
                                        dayjs(`2000-01-01T${b.timeSlot?.startTime}`).valueOf()
                                    )
                                    .map((reservation: Reservation) => (
                                        <div key={`reservation-${reservation.id}`} className={styles.reservationCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{reservation.field.name}</h3>
                                                <div className={styles.cardDate}>
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {reservation.timeSlot?.startTime} hs
                                                </div>
                                                <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                          Pendiente
                        </span>
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div className={styles.userInfo}>
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className={styles.userName}>
                                                            {reservation.event.ownerName}
                                                        </p>
                                                        <p>
                                                            {reservation.event.ownerPhone ? (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.userContact}
                                                                >
                                                                    Enviar mensaje
                                                                </a>
                                                            ) : 'Sin teléfono'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.cardFooter}>
                                                <button
                                                    className={styles.acceptButton}
                                                    onClick={() => handleAccept(reservation.id)}
                                                >Aceptar</button>
                                                <button
                                                    className={styles.rejectButton}
                                                    onClick={() => handleReject(reservation.id)}
                                                >Rechazar</button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Próximas Reservas */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <Hourglass className={`${styles.sectionIcon} text-[#000066]`} />
                            Próximas Reservas
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r =>
                                (r.status === 'pending' || r.status === 'confirmed') &&
                                isDateCurrentOrFuture(r.timeSlot?.availabilityDate)
                            ).length === 0 ? (
                                <div className={styles.emptyState}>No hay próximas reservas</div>
                            ) : (
                                reservations
                                    .filter(r =>
                                        (r.status === 'pending' || r.status === 'confirmed') &&
                                        isDateCurrentOrFuture(r.timeSlot?.availabilityDate)
                                    )
                                    .sort((a, b) =>
                                        dayjs(a.timeSlot?.availabilityDate).valueOf() -
                                        dayjs(b.timeSlot?.availabilityDate).valueOf() ||
                                        dayjs(`2000-01-01T${a.timeSlot?.startTime}`).valueOf() -
                                        dayjs(`2000-01-01T${b.timeSlot?.startTime}`).valueOf()
                                    )
                                    .map((reservation: Reservation) => (
                                        <div key={`reservation-${reservation.id}`} className={styles.reservationCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{reservation.field.name}</h3>
                                                <div className={styles.cardDate}>
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {reservation.timeSlot?.startTime} hs
                                                </div>
                                                <span className={`${styles.statusBadge} ${reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending}`}>
                          {reservation.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                        </span>
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div className={styles.userInfo}>
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className={styles.userName}>
                                                            {reservation.event.ownerName}
                                                        </p>
                                                        <p>
                                                            {reservation.event.ownerPhone ? (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.userContact}
                                                                >
                                                                    Enviar mensaje
                                                                </a>
                                                            ) : 'Sin teléfono'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.cardFooter}>
                                                {reservation.status === 'confirmed' && (
                                                    <button
                                                        className={styles.rejectButton}
                                                        onClick={() => handleDeleteReservation(reservation.id)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Reservas Pasadas */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <Clock className={`${styles.sectionIcon} text-[#000066]`} />
                            Reservas Pasadas
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r =>
                                r.status === 'confirmed' &&
                                dayjs(r.timeSlot?.availabilityDate).isBefore(dayjs(), 'day')
                            ).length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas pasadas</div>
                            ) : (
                                reservations
                                    .filter(r =>
                                        r.status === 'confirmed' &&
                                        dayjs(r.timeSlot?.availabilityDate).isBefore(dayjs(), 'day')
                                    )
                                    .map((reservation: Reservation) => (
                                        <div key={`reservation-${reservation.id}`} className={styles.reservationCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{reservation.field.name}</h3>
                                                <div className={styles.cardDate}>
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {reservation.timeSlot?.startTime} hs
                                                </div>
                                                <span className={`${styles.statusBadge} ${styles.statusConfirmed}`}>
                          Completada
                        </span>
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div className={styles.userInfo}>
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className={styles.userName}>
                                                            {reservation.event.ownerName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Reservas Canceladas */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <Users className={`${styles.sectionIcon} text-[#000066]`} />
                            Reservas Canceladas
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r => r.status === 'cancelled').length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas canceladas</div>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'cancelled')
                                    .map((reservation: Reservation) => (
                                        <div key={`reservation-${reservation.id}`} className={styles.reservationCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{reservation.field.name}</h3>
                                                <div className={styles.cardDate}>
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {reservation.timeSlot?.startTime} hs
                                                </div>
                                                <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                          Cancelada
                        </span>
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div className={styles.userInfo}>
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className={styles.userName}>
                                                            {reservation.event.ownerName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>
                </div>
            )}
            <div className="text-center text-gray-400 text-sm mt-8 pb-4">
                Al ser usuario de la aplicación tenemos tu consentimiento sobre los <a href="/terms-and-conditions" className="underline hover:text-gray-600">términos y condiciones</a>
            </div>
        </div>
    );
};

