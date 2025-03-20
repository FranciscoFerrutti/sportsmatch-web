import { useEffect, useState } from 'react';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import { useAuth } from "../../context/AppContext.tsx";
import { UserCircle, MapPin, Clock, Users, Calendar, CheckCircle, BookOpen, Phone, UserPlus, UserCheck, ChevronDown, ChevronUp, Hourglass } from 'lucide-react';
import isToday from 'dayjs/plugin/isToday';
import { Event } from '@/types/event';
import styles from './HomeView.module.css';
import { ParticipantRequests } from '../Events/ParticipantRequests';

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
    const [pendingRequestsCounts, setPendingRequestsCounts] = useState<Record<number, number>>({});
    const [acceptedParticipantsCounts, setAcceptedParticipantsCounts] = useState<Record<number, number>>({});
    const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
    const [visibleDescriptions, setVisibleDescriptions] = useState<number[]>([]);

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
                        timeSlot: reservation.timeSlots && reservation.timeSlots.length > 0 ? {
                            id: reservation.timeSlots[0].id,
                            availabilityDate: reservation.timeSlots[0].date,
                            startTime: reservation.timeSlots[0].startTime || reservation.timeSlots[0].start_time,
                            endTime: reservation.timeSlots[0].endTime || reservation.timeSlots[0].end_time,
                            slotStatus: "booked"
                        } : null,
                        payment: reservation.payment || {
                            isPaid: false,
                            paymentDate: null,
                            paymentAmount: null,
                            isRefunded: false,
                            refundDate: null,
                            refundAmount: null
                        },
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
            const response = await apiClient.get(`/events?userId=${clubId}&organizerType=club`, { headers: { 'c-api-key': apiKey } });

            if (response.data && Array.isArray(response.data.items)) {
                const now = dayjs();
                const todayEvents = response.data.items.filter((event: Event) => {
                    const eventTime = dayjs(event.schedule).add(3, 'hour');
                    const duration = event.duration || 60;
                    const eventEndTime = eventTime.add(duration, 'minutes');

                    return eventTime.isSame(now, 'day') && eventEndTime.isAfter(now);
                });

                setEventsToday(todayEvents);
                
                fetchParticipantsCounts(todayEvents);
            } else {
                console.error("❌ Error: La API no devolvió un array de eventos en 'items'");
                setEventsToday([]);
            }
        } catch (error) {
            console.error('❌ Error al obtener eventos del día de hoy:', error);
            setEventsToday([]);
        }
    };
    
    const fetchParticipantsCounts = async (eventsList: Event[]) => {
        if (!apiKey) return;

        const pendingCounts: Record<number, number> = {};
        const acceptedCounts: Record<number, number> = {};
        
        await Promise.all(
            eventsList.map(async (event) => {
                try {
                    // Fetch pending participants
                    const pendingResponse = await apiClient.get(`/events/${event.id}/participants?status=pending`, {
                        headers: { 
                            'c-api-key': apiKey,
                            'x-auth-type': 'club'
                        }
                    });
                    
                    if (pendingResponse.data && Array.isArray(pendingResponse.data)) {
                        pendingCounts[event.id] = pendingResponse.data.length;
                    } else {
                        pendingCounts[event.id] = 0;
                    }

                    // Fetch accepted participants
                    const acceptedResponse = await apiClient.get(`/events/${event.id}/participants?status=accepted`, {
                        headers: { 
                            'c-api-key': apiKey,
                            'x-auth-type': 'club'
                        }
                    });
                    
                    if (acceptedResponse.data && Array.isArray(acceptedResponse.data)) {
                        acceptedCounts[event.id] = acceptedResponse.data.length;
                    } else {
                        acceptedCounts[event.id] = 0;
                    }
                } catch (error) {
                    console.error(`Error al obtener participantes para evento ${event.id}:`, error);
                    pendingCounts[event.id] = 0;
                    acceptedCounts[event.id] = 0;
                }
            })
        );
        
        setPendingRequestsCounts(pendingCounts);
        setAcceptedParticipantsCounts(acceptedCounts);
    };

    useEffect(() => {
        fetchReservations();
        fetchEventsToday();
    }, [clubId, apiKey]);


    // Función para verificar si una fecha es hoy
    const isDateToday = (dateString: string | undefined) => {
        if (!dateString) return false;
        return dayjs(dateString).isToday();
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
    
    // Función para verificar si el tiempo de finalización es posterior a la hora actual
    const isEndTimeAfterNow = (dateString: string | undefined, endTime?: string) => {
        if (!dateString || !endTime) return false;
        
        const now = dayjs();
        const date = dayjs(dateString);
        
        // If the date is in the future, it's always valid
        if (date.isAfter(now, 'day')) {
            return true;
        }
        
        // If the date is today, check the end time
        if (date.isSame(now, 'day')) {
            // Parse the end time (format: "HH:mm")
            const [hours, minutes] = endTime.split(':');
            const reservationEndTime = date.hour(parseInt(hours)).minute(parseInt(minutes));
            
            // Return true if the reservation end time is in the future
            return reservationEndTime.isAfter(now);
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
    
    const toggleEventExpansion = (eventId: number) => {
        setExpandedEvents(prev => 
            prev.includes(eventId) 
                ? prev.filter(id => id !== eventId) 
                : [...prev, eventId]
        );
    };

    const toggleDescriptionVisibility = (eventId: number) => {
        setVisibleDescriptions(prev => 
            prev.includes(eventId) 
                ? prev.filter(id => id !== eventId) 
                : [...prev, eventId]
        );
    };

    const handleRequestsChange = (eventId: number, action: 'accept' | 'reject') => {
        // Update the participants counts for this event
        if (action === 'accept') {
            // When accepting a participant, decrease pending count and increase accepted count
            setPendingRequestsCounts(prev => ({
                ...prev,
                [eventId]: Math.max(0, (prev[eventId] || 0) - 1)
            }));
            setAcceptedParticipantsCounts(prev => ({
                ...prev,
                [eventId]: (prev[eventId] || 0) + 1
            }));

            // Update the remaining players count in the event
            setEventsToday(prev => prev.map(event => {
                if (event.id === eventId && event.remaining) {
                    return {
                        ...event,
                        remaining: Math.max(0, event.remaining - 1)
                    };
                }
                return event;
            }));
        } else if (action === 'reject') {
            // When rejecting a participant, just decrease pending count
            setPendingRequestsCounts(prev => ({
                ...prev,
                [eventId]: Math.max(0, (prev[eventId] || 0) - 1)
            }));
        }

        // Also fetch from server to ensure data consistency
        fetchParticipantsCounts(eventsToday);
    };

    return (
        <div className={styles.dashboardContainer}>
            <h1 className="text-2xl font-bold text-[#000066] mb-8">Inicio</h1>

            {loading ? (
                <div className={styles.loadingSpinner}>
                    <p className={styles.loadingText}>Cargando información</p>
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
                                                            className="w-10 h-10 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between">
                                                            <p className={styles.userName}>
                                                                {reservation.event.ownerName}
                                                            </p>
                                                            {reservation.event.ownerPhone && (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.contactButton}
                                                                    title="Contactar"
                                                                >
                                                                    <Phone className="h-4 w-4" />
                                                                </a>
                                                            )}
                                                        </div>
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
                            {reservations.filter(r => 
                                (r.status === 'confirmed' || r.status === 'completed') && 
                                isDateToday(r.timeSlot?.availabilityDate) && 
                                isEndTimeAfterNow(r.timeSlot?.availabilityDate, r.timeSlot?.endTime)
                            ).length === 0 ? (
                                <div className={styles.emptyState}>No hay reservas para hoy</div>
                            ) : (
                                reservations
                                    .filter(r => 
                                        (r.status === 'confirmed' || r.status === 'completed') && 
                                        isDateToday(r.timeSlot?.availabilityDate) && 
                                        isEndTimeAfterNow(r.timeSlot?.availabilityDate, r.timeSlot?.endTime)
                                    )
                                    .sort((a, b) =>
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
                                                {dayjs().isAfter(dayjs(`${reservation.timeSlot?.availabilityDate}T${reservation.timeSlot?.startTime}`)) ? (
                                                    <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                                                        En progreso
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${reservation.status === 'confirmed' ? styles.statusConfirmed : styles.statusCompleted}`}>
                                                        {reservation.status === 'confirmed' ? 'Confirmado' : 'Señado'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div className={styles.userInfo}>
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-10 h-10 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            <UserCircle className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between">
                                                            <p className={styles.userName}>
                                                                {reservation.event.ownerName}
                                                            </p>
                                                            {reservation.event.ownerPhone && (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.contactButton}
                                                                    title="Contactar"
                                                                >
                                                                    <Phone className="h-4 w-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {reservation.status !== 'pending' && (
                                                    <div className={styles.paymentInfo}>
                                                        <h4 className={styles.paymentTitle}>Información de Pago</h4>
                                                        <div className={styles.paymentDetails}>
                                                            <div className={styles.paymentRow}>
                                                                <span className={styles.paymentLabel}>Estado:</span>
                                                                <span className={`${styles.paymentValue} ${reservation.payment?.isPaid ? styles.paymentPaid : styles.paymentUnpaid}`}>
                                                                    {reservation.payment?.isPaid ? 'Pagado' : 'No pagado'}
                                                                </span>
                                                            </div>
                                                            {reservation.payment?.isPaid ? (
                                                                <>
                                                                    <div className={styles.paymentRow}>
                                                                        <span className={styles.paymentLabel}>Monto:</span>
                                                                        <span className={styles.paymentValue}>
                                                                            ${(reservation.cost / 2).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <div className={styles.paymentRow}>
                                                                        <span className={styles.paymentLabel}>Fecha:</span>
                                                                        <span className={styles.paymentValue}>
                                                                            {reservation.payment?.paymentDate ? dayjs(reservation.payment.paymentDate).format("DD/MM/YYYY HH:mm") : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className={styles.paymentRow}>
                                                                        <span className={styles.paymentLabel}>Total a pagar en club:</span>
                                                                        <span className={styles.paymentValue}>
                                                                            ${(reservation.cost / 2).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className={styles.paymentRow}>
                                                                        <span className={styles.paymentLabel}>Total a señar:</span>
                                                                        <span className={styles.paymentValue}>
                                                                            ${(reservation.cost / 2).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <div className={styles.paymentRow}>
                                                                        <span className={styles.paymentLabel}>Total a pagar en club:</span>
                                                                        <span className={styles.paymentValue}>
                                                                            ${(reservation.cost / 2).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.cardFooter}>
                                                <div className="flex-grow"></div>
                                                {!dayjs().isAfter(dayjs(`${reservation.timeSlot?.availabilityDate}T${reservation.timeSlot?.startTime}`)) && (
                                                    <button 
                                                        className={styles.rejectButton}
                                                        onClick={() => handleReject(reservation.id)}
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
                                        <div key={`event-${event.id}`} className={styles.eventCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{event.sportName}</h3>
                                                <div className={styles.cardDate}>
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).add(3, 'hour').format("HH:mm")} hs
                                                </div>
                                                {event.duration && (
                                                    <div className={styles.cardTime}>
                                                        <Hourglass className="w-4 h-4 mr-1" />
                                                        Duración: {event.duration} min
                                                    </div>
                                                )}
                                                {dayjs().isAfter(dayjs(event.schedule).add(3, 'hour')) ? (
                                                    <span className={`${styles.statusBadge} ${styles.statusInProgress}`}>
                                                        En progreso
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.statusConfirmed}`}>
                                                        Próximo
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.cardContent}>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="flex items-center text-gray-600 text-sm">
                                                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" /> 
                                                        <span className="truncate">{event.location}</span>
                                                    </p>
                                                    <p className="flex items-center text-gray-600 text-sm">
                                                        <Users className="w-4 h-4 mr-1 flex-shrink-0" /> 
                                                        {event.remaining} jugadores faltantes
                                                    </p>
                                                </div>

                                                <div className="mt-2 space-y-1">
                                                    {pendingRequestsCounts[event.id] > 0 && (
                                                        <div className="flex items-center text-blue-600 text-sm">
                                                            <UserPlus className="w-4 h-4 mr-1 flex-shrink-0" />
                                                            <span>{pendingRequestsCounts[event.id]} solicitudes</span>
                                                        </div>
                                                    )}

                                                    {acceptedParticipantsCounts[event.id] > 0 && (
                                                        <div className="flex items-center text-green-600 text-sm">
                                                            <UserCheck className="w-4 h-4 mr-1 flex-shrink-0" />
                                                            <span>{acceptedParticipantsCounts[event.id]} confirmados</span>
                                                        </div>
                                                    )}

                                                    {(!pendingRequestsCounts[event.id] || pendingRequestsCounts[event.id] === 0) &&
                                                        (!acceptedParticipantsCounts[event.id] || acceptedParticipantsCounts[event.id] === 0) && (
                                                            <div className="flex items-center text-gray-500 text-sm">
                                                                <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                                                                <span>Sin participantes</span>
                                                            </div>
                                                        )}
                                                </div>

                                                {event.description && (
                                                    <div className="mt-2">
                                                        <button
                                                            className={styles.descriptionToggle}
                                                            onClick={() => toggleDescriptionVisibility(event.id)}
                                                        >
                                                            {visibleDescriptions.includes(event.id) ? (
                                                                <span className="flex items-center text-sm">
                                                                    Ocultar descripción <ChevronUp className="ml-1 h-3 w-3" />
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center text-sm">
                                                                    Ver descripción <ChevronDown className="ml-1 h-3 w-3" />
                                                                </span>
                                                            )}
                                                        </button>

                                                        {visibleDescriptions.includes(event.id) && (
                                                            <div className={styles.descriptionContent}>
                                                                {event.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {(pendingRequestsCounts[event.id] > 0 || acceptedParticipantsCounts[event.id] > 0) && (
                                                <div className={styles.cardFooter}>
                                                    <button
                                                        className={styles.descriptionToggle}
                                                        onClick={() => toggleEventExpansion(event.id)}
                                                    >
                                                        {expandedEvents.includes(event.id) ? (
                                                            <span className="flex items-center text-sm">
                                                                Ocultar participantes <ChevronUp className="ml-1 h-3 w-3" />
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center text-sm">
                                                                Ver participantes <ChevronDown className="ml-1 h-3 w-3" />
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            )}

                                            {expandedEvents.includes(event.id) && (
                                                <div className={styles.participantList}>
                                                    <ParticipantRequests
                                                        eventId={event.id}
                                                        onRequestsChange={(action) => handleRequestsChange(event.id, action)}
                                                    />
                                                </div>
                                            )}
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