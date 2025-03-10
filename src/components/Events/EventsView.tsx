import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { NewEvent } from './NewEvent';
import { useAuth } from '@/context/AppContext';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import { Event } from '@/types/event'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarIcon, MapPin, ClockIcon, Users, ChevronDown, ChevronUp, UserPlus, UserCheck } from 'lucide-react';
import { ParticipantRequests } from './ParticipantRequests';

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

    const fetchEvents = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
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
        return dayjs(dateString).isAfter(dayjs(), 'day');
    };

    const toggleEventExpansion = (eventId: number) => {
        setExpandedEvents(prev => 
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
                <h1 className="text-2xl font-bold text-[#000066]">Eventos organizados por mi</h1>

                {/* Botón para abrir el modal de nuevo evento */}
                <Button className="bg-[#000066] hover:bg-[#000088] text-white px-6 py-2 rounded-lg shadow-md"
                        onClick={() => setIsModalOpen(true)}>
                    + Nuevo Evento
                </Button>
            </div>

            {loading ? (
                <p className="text-center text-gray-500">Cargando eventos...</p>
            ) : (
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* 🔹 Próximos Eventos */}
                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">📅 Próximos Eventos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.filter(e => isDateFuture(e.schedule)).length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay próximos eventos</Card>
                            ) : (
                                events
                                    .filter(e => isDateFuture(e.schedule))
                                    .sort((a, b) => dayjs(a.schedule).valueOf() - dayjs(b.schedule).valueOf())
                                    .map((event: any) => (
                                        <Card key={`event-${event.id}`}
                                              className="shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white overflow-hidden">
                                            <CardHeader>
                                                <CardTitle>{event.sportName}</CardTitle>
                                                <p className="text-gray-600 flex items-center">
                                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("DD/MM/YYYY")}
                                                </p>
                                                <p className="text-gray-600 flex items-center">
                                                    <ClockIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("HH:mm")} hs
                                                </p>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-600 flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1" /> {event.location}
                                                </p>
                                                <p className="text-gray-600 flex items-center">
                                                    <Users className="w-4 h-4 mr-1" /> {event.remaining} jugadores faltantes
                                                </p>
                                                
                                                <div className="mt-3 space-y-1">
                                                    {pendingRequestsCounts[event.id] > 0 && (
                                                        <div className="flex items-center text-blue-600">
                                                            <UserPlus className="w-4 h-4 mr-1" />
                                                            <span>{pendingRequestsCounts[event.id]} solicitudes pendientes</span>
                                                        </div>
                                                    )}
                                                    
                                                    {acceptedParticipantsCounts[event.id] > 0 && (
                                                        <div className="flex items-center text-green-600">
                                                            <UserCheck className="w-4 h-4 mr-1" />
                                                            <span>{acceptedParticipantsCounts[event.id]} participantes confirmados</span>
                                                        </div>
                                                    )}
                                                    
                                                    {(!pendingRequestsCounts[event.id] || pendingRequestsCounts[event.id] === 0) && 
                                                     (!acceptedParticipantsCounts[event.id] || acceptedParticipantsCounts[event.id] === 0) && (
                                                        <div className="flex items-center text-gray-500">
                                                            <Users className="w-4 h-4 mr-1" />
                                                            <span>Todavía no hay participantes</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                            
                                            {(pendingRequestsCounts[event.id] > 0 || acceptedParticipantsCounts[event.id] > 0) && (
                                                <CardFooter className="border-t border-gray-100 pt-3 pb-0">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full flex items-center justify-center text-blue-600"
                                                        onClick={() => toggleEventExpansion(event.id)}
                                                    >
                                                        {expandedEvents.includes(event.id) ? (
                                                            <>Ocultar participantes <ChevronUp className="ml-1 h-4 w-4" /></>
                                                        ) : (
                                                            <>Ver participantes <ChevronDown className="ml-1 h-4 w-4" /></>
                                                        )}
                                                    </Button>
                                                </CardFooter>
                                            )}
                                            
                                            {expandedEvents.includes(event.id) && (
                                                <div className="px-4 pb-4 pt-2 bg-gray-50">
                                                    <ParticipantRequests 
                                                        eventId={event.id} 
                                                        onRequestsChange={(action) => handleRequestsChange(event.id, action)}
                                                    />
                                                </div>
                                            )}
                                        </Card>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Eventos Pasados */}
                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">⏳ Eventos Pasados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.filter(e => !isDateFuture(e.schedule)).length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay eventos pasados</Card>
                            ) : (
                                events
                                    .filter(e => !isDateFuture(e.schedule))
                                    .sort((a, b) => dayjs(b.schedule).valueOf() - dayjs(a.schedule).valueOf())
                                    .map((event: any) => (
                                        <Card key={`event-${event.id}`}
                                              className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                                            <CardHeader>
                                                <CardTitle>{event.sportName}</CardTitle>
                                                <p className="text-gray-600 flex items-center">
                                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("DD/MM/YYYY")}
                                                </p>
                                                <p className="text-gray-600 flex items-center">
                                                    <ClockIcon className="w-4 h-4 mr-1" />
                                                    {dayjs(event.schedule).format("HH:mm")} hs
                                                </p>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-600 flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1" /> {event.location}
                                                </p>
                                                <p className="text-gray-600 flex items-center">
                                                    <Users className="w-4 h-4 mr-1" /> {event.remaining} jugadores faltantes
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Modal para nuevo evento */}
            <NewEvent isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};
