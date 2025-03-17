import { useState, useEffect } from 'react';
import { NewEvent } from './NewEvent';
import { useAuth } from '@/context/AppContext';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import { Event } from '@/types/event'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarIcon, MapPin, ClockIcon, Users, ChevronDown, ChevronUp, UserPlus, UserCheck, Hourglass } from 'lucide-react';
import { ParticipantRequests } from './ParticipantRequests';
import styles from './Events.module.css';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const EventsView = () => {
    const { clubId } = useAuth();
    const apiKey = localStorage.getItem('c-api-key');

    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
    const [pendingRequestsCounts, setPendingRequestsCounts] = useState<Record<number, number>>({});
    const [acceptedParticipantsCounts, setAcceptedParticipantsCounts] = useState<Record<number, number>>({});
    const [visibleDescriptions, setVisibleDescriptions] = useState<number[]>([]);

    const fetchEvents = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', {apiKey, clubId});
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get(`/events?userId=${clubId}&organizerType=club`, { headers: { 'c-api-key': apiKey } });

            if (response.data && Array.isArray(response.data.items)) {
                setEvents(response.data.items); // Extraer solo los items del paginado
                // Fetch pending requests counts for each event
                fetchParticipantsCounts(response.data.items);
            } else {
                console.error("❌ Error: La API no devolvió un array de eventos en 'items'");
                setEvents([]);
            }
        } catch (error) {
            console.error('❌ Error al obtener eventos:', error);
            setEvents([]);
        } finally {
            setLoading(false);
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
        fetchEvents();
    }, [clubId, apiKey]);

    const isDateFuture = (dateString: string | undefined) => {
        if (!dateString) return false;
        
        const now = dayjs();
        const eventDate = dayjs(dateString);
        
        // If the date is in the future, it's always valid
        if (eventDate.isAfter(now, 'day')) {
            return true;
        }
        
        // If the date is today, check the time
        if (eventDate.isSame(now, 'day')) {
            // Extract the time from the event date
            const eventHour = eventDate.hour();
            const eventMinute = eventDate.minute();
            
            // Create a datetime with today's date and the event time
            const eventDateTime = now.hour(eventHour).minute(eventMinute).second(0);
            
            // Return true if the event time is in the future
            return eventDateTime.isAfter(now);
        }
        
        // If the date is in the past
        return false;
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
            setEvents(prev => prev.map(event => {
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
        fetchParticipantsCounts(events);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Eventos</h1>

                {/* Botón para abrir el modal de nuevo evento */}
                <button
                    className={styles.createButton}
                    onClick={() => setIsModalOpen(true)}
                >
                    + Nuevo Evento
                </button>
            </div>

            {loading ? (
                <div className={styles.loadingSpinner}>
                    <p className={styles.loadingText}>Cargando eventos</p>
                </div>
            ) : (
                <div className="mx-auto space-y-12">

                    {/* 🔹 Próximos Eventos */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <CalendarIcon className={`${styles.sectionIcon} text-[#000066]`} />
                            Próximos Eventos
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {events.filter(e => isDateFuture(e.schedule)).length === 0 ? (
                                <div className={styles.emptyState}>No hay próximos eventos</div>
                            ) : (
                                events
                                    .filter(e => isDateFuture(e.schedule))
                                    .sort((a, b) => dayjs(a.schedule).valueOf() - dayjs(b.schedule).valueOf())
                                    .map((event: any) => (
                                        <div key={`event-${event.id}`} className={styles.eventCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{event.sportName}</h3>
                                                <div className={styles.cardDate}>
                                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <ClockIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("HH:mm")} hs
                                                </div>
                                                {event.duration && (
                                                    <div className={styles.cardTime}>
                                                        <Hourglass className="w-4 h-4 mr-1" />
                                                        Duración: {event.duration} min
                                                    </div>
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

                    {/* 🔹 Eventos Pasados */}
                    <section>
                        <h2 className={styles.sectionHeader}>
                            <ClockIcon className={`${styles.sectionIcon} text-[#000066]`} />
                            Eventos Pasados
                        </h2>
                        <div className={styles.dashboardGrid}>
                            {events.filter(e => !isDateFuture(e.schedule)).length === 0 ? (
                                <div className={styles.emptyState}>No hay eventos pasados</div>
                            ) : (
                                events
                                    .filter(e => !isDateFuture(e.schedule))
                                    .sort((a, b) => dayjs(b.schedule).valueOf() - dayjs(a.schedule).valueOf())
                                    .map((event: any) => (
                                        <div key={`event-${event.id}`} className={styles.eventCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={styles.cardTitle}>{event.sportName}</h3>
                                                <div className={styles.cardDate}>
                                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("DD/MM/YYYY")}
                                                </div>
                                                <div className={styles.cardTime}>
                                                    <ClockIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("HH:mm")} hs
                                                </div>
                                                {event.duration && (
                                                    <div className={styles.cardTime}>
                                                        <Hourglass className="w-4 h-4 mr-1" />
                                                        Duración: {event.duration} min
                                                    </div>
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
                                                        {acceptedParticipantsCounts[event.id] || 0} participantes
                                                    </p>
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
                                        </div>
                                    ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Modal para nuevo evento */}
            <NewEvent isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            
            <div className="text-center text-gray-400 text-sm mt-8 pb-4">
                Al ser usuario de la aplicación tenemos tu consentimiento sobre los <a href="/terms-and-conditions" className="underline hover:text-gray-600">términos y condiciones</a>
            </div>
        </div>
    );
};
