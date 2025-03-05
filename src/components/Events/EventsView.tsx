import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { NewEvent } from './NewEvent';
import { useAuth } from '@/context/AppContext';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import { Event } from '@/types/event'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarIcon, MapPin, ClockIcon, Users } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const EventsView = () => {
    const { clubId } = useAuth();
    const apiKey = localStorage.getItem('c-api-key');

    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get(`/events`, { headers: { 'c-api-key': apiKey } });

            if (response.data && Array.isArray(response.data.items)) {
                setEvents(response.data.items); // Extraer solo los items del paginado
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


    useEffect(() => {
        fetchEvents();
    }, [clubId, apiKey]);

    const isDateFuture = (dateString: string | undefined) => {
        if (!dateString) return false;
        return dayjs(dateString).isAfter(dayjs(), 'day');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Eventos</h1>

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
