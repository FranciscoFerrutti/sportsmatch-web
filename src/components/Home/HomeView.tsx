import { useEffect, useState } from 'react';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import { useAuth } from "../../context/AppContext.tsx";
import { UserCircle, MapPin, Clock, Users, Calendar, CheckCircle } from 'lucide-react';
import isToday from 'dayjs/plugin/isToday';
import { Event } from '@/types/event';
import styles from './HomeView.module.css';

dayjs.extend(isToday);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const HomeView = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const { clubId } = useAuth();
    const [loading, setLoading] = useState(true);
    const apiKey = localStorage.getItem('c-api-key');
    const [eventsToday, setEventsToday] = useState<Event[]>([]);

    const fetchReservations = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get(`/reservations`, { headers: { 'c-api-key': apiKey } });
            const reservationsList = response.data;

            const detailedReservations = await Promise.all(
                reservationsList.map(async (reservation: any) => {
                    try {
                        const detailsResponse = await apiClient.get(`/reservations/${reservation.id}`, {
                            headers: { 'c-api-key': apiKey }
                        });

                        // Extraer correctamente los datos del timeSlot
                        const timeSlotData = detailsResponse.data.timeSlots[0] || {};
                        const timeSlot = {
                            id: timeSlotData.id,
                            startTime: timeSlotData.start_time,
                            endTime: timeSlotData.end_time,
                            availabilityDate: timeSlotData.availability_date
                        };

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
                            timeSlot: timeSlot,
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

    const fetchEventsToday = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
            return;
        }

        try {
            const response = await apiClient.get(`/events`, { headers: { 'c-api-key': apiKey } });

            if (response.data && Array.isArray(response.data.items)) {
                // Filtrar eventos que sean de hoy
                const todayEvents = response.data.items.filter((event: Event) =>
                    dayjs(event.schedule).isSame(dayjs(), 'day')
                );

                setEventsToday(todayEvents);
            } else {
                console.error("❌ Error: La API no devolvió un array de eventos en 'items'");
                setEventsToday([]);
            }
        } catch (error) {
            console.error('❌ Error al obtener eventos del día de hoy:', error);
            setEventsToday([]);
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchEventsToday();
    }, [clubId, apiKey]);


    // Función para verificar si una fecha es hoy
    const isDateToday = (dateString: string | undefined) => {
        if (!dateString) return false;
        const today = dayjs().format('YYYY-MM-DD');
        return dayjs(dateString).format('YYYY-MM-DD') === today;
    };

    // Función para verificar si una fecha es actual o futura
    const isDateCurrentOrFuture = (dateString: string | undefined, startTime?: string) => {
        if (!dateString) return false;
        
        const now = dayjs();
        const date = dayjs(dateString);
        
        // If the date is in the future, it's always valid
        if (date.isAfter(now, 'day')) {
            return true;
        }
        
        // If the date is today, check the time
        if (date.isSame(now, 'day')) {
            // If no start time provided, consider it as future
            if (!startTime) return true;
            
            // Parse the start time (format: "HH:mm")
            const [hours, minutes] = startTime.split(':');
            const reservationTime = date.hour(parseInt(hours)).minute(parseInt(minutes));
            
            // Return true if the reservation time is in the future
            return reservationTime.isAfter(now);
        }
        
        // If the date is in the past
        return false;
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

    return (
        <div className={styles.dashboardContainer}>
            <h1 className="text-2xl font-bold text-[#000066] mb-8">Inicio</h1>

            {loading ? (
                <div className={styles.loadingSpinner}>
                    <p className={styles.loadingText}>Cargando reservas</p>
                </div>
            ) : (
                <div className="mx-auto space-y-12">

                    {/* 🔹 Reservas Pendientes */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <Calendar className={`${styles.sectionIcon} text-[#000066]`} />
                            Reservas Pendientes
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r => r.status === 'pending' && isDateCurrentOrFuture(r.timeSlot?.availabilityDate, r.timeSlot?.startTime)).length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas pendientes</div>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'pending' && isDateCurrentOrFuture(r.timeSlot?.availabilityDate, r.timeSlot?.startTime))
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
                                                <span className={`${styles.statusBadge} ${styles.statusPending} mt-2`}>
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

                    <section>
                        <h2 className={styles.sectionHeader}>
                            <CheckCircle className={`${styles.sectionIcon} text-[#000066]`} />
                            Reservas del Día de Hoy
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {reservations.filter(r => r.status === 'confirmed' && isDateToday(r.timeSlot?.availabilityDate)).length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas para hoy</div>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'confirmed' && isDateToday(r.timeSlot?.availabilityDate))
                                    .sort((a, b) =>
                                        dayjs(`2000-01-01T${a.timeSlot?.startTime}`).valueOf() -
                                        dayjs(`2000-01-01T${b.timeSlot?.startTime}`).valueOf()
                                    )
                                    .map((reservation: Reservation) => (
                                        <div key={`confirmed-${reservation.id}`} className={styles.reservationCard}>
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
                                                <span className={`${styles.statusBadge} ${styles.statusConfirmed} mt-2`}>
                                                    Confirmado
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
                                                <button className={styles.rejectButton}>
                                                    Cancelar Reserva
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Eventos del Día de Hoy */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <Users className={`${styles.sectionIcon} text-[#000066]`} />
                            Eventos del Día de Hoy
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {eventsToday.length === 0 ? (
                                <div className={styles.emptyState}>No hay eventos para hoy</div>
                            ) : (
                                eventsToday
                                    .sort((a, b) => dayjs(a.schedule).valueOf() - dayjs(b.schedule).valueOf())
                                    .map((event) => (
                                        <div key={`event-${event.id}`} className={styles.reservationCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{event.sportName}</h3>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("HH:mm")} hs
                                                </div>
                                            </div>
                                            <div className={styles.cardContent}>
                                                <p className="flex items-center text-gray-600 mb-2">
                                                    <MapPin className="w-4 h-4 mr-1" /> {event.location}
                                                </p>
                                                <p className="flex items-center text-gray-600">
                                                    <Users className="w-4 h-4 mr-1" /> {event.remaining} jugadores faltantes
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};