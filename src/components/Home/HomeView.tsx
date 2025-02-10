import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';

dayjs.extend(utc);
dayjs.extend(timezone);

export const HomeView = () => {

    const [reservations, setReservations] = useState<Reservation[]>([]);

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

    const pendingReservations = reservations
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());

    const upcomingReservations = reservations
        .filter(r => r.status === 'accepted')
        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
        .slice(0, 5);

    const handleAccept = async (reservationId: number) => {
        try {
            await apiClient.put(`/reservations/${reservationId}/accept`);
            setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'accepted' } : r));
        } catch (error) {
            alert('No se puede aceptar la reserva porque el horario ya no está disponible');
            console.error('Error al aceptar la reserva:', error);
        }
    };

    const handleReject = async (reservationId: number) => {
        try {
            await apiClient.put(`/reservations/${reservationId}/reject`);
            setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'rejected' } : r));
        } catch (error) {
            console.error('Error al rechazar la reserva:', error);
        }
    };

    const formatDate = (dateStr: string) => dayjs.tz(dateStr, dayjs.tz.guess()).format('dddd, D [de] MMMM [de] YYYY');
    const formatTime = (time: string) => time.replace(':00', 'hs');
    const isToday = (dateStr: string) => new Date(dateStr).toDateString() === new Date().toDateString();
    const isTomorrow = (dateStr: string) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new Date(dateStr).toDateString() === tomorrow.toDateString();
    };
    const getRelativeDate = (dateStr: string) => (isToday(dateStr) ? 'Hoy' : isTomorrow(dateStr) ? 'Mañana' : formatDate(dateStr));

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-6">Inicio</h1>

            <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Reservas pendientes de aprobación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingReservations.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                        </div>
                    ) : (
                        pendingReservations.map(reservation => (
                            <Card key={reservation.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{`Cancha ${reservation.courtId}`}</h3>
                                        <div className="space-y-1">
                                            <p className="text-gray-600">{getRelativeDate(reservation.date)}</p>
                                            <p className="text-gray-600">{formatTime(reservation.time)}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleAccept(reservation.id)}>
                                            Aceptar
                                        </Button>
                                        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleReject(reservation.id)}>
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
                        upcomingReservations.map(reservation => (
                            <Card key={reservation.id} className="p-4 hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-lg mb-1">{`Cancha ${reservation.courtId}`}</h3>
                                <div className="space-y-1">
                                    <p className="text-gray-600">{getRelativeDate(reservation.date)}</p>
                                    <p className="text-gray-600">{formatTime(reservation.time)}</p>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
