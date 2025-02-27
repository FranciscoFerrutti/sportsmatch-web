import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import {useAuth} from "../../context/AppContext.tsx";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const HomeView = () => {

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const { clubId } = useAuth();
    const [loading, setLoading] = useState(true);
    const apiKey = localStorage.getItem('c-api-key');

    const fetchReservations = async () => {
        if (!apiKey || !clubId) {
            console.error('🚨 Error: Falta API Key o clubId', { apiKey, clubId });
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get(`/reservations`, { headers: { 'c-api-key': apiKey } });
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
                                ownerPhone: detailsResponse.data.event?.userOwner?.phone_number || 'Sin teléfono'
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

            await apiClient.patch(`/reservations/${reservationId}/status`, {
                status: 'cancelled'
            }, {
                headers: { 'c-api-key': apiKey },
            });

            fetchReservations();
        } catch (error) {
            console.error('Error al rechazar la reserva:', error);
            alert('No se pudo rechazar la reserva.');
        }
    };

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


    const formatDate = (dateStr: string) => {
        return dayjs(dateStr).locale('es').format('dddd D [de] MMMM [de] YYYY')
            .replace(/^./, match => match.toUpperCase());
    };


    const formatTime = (reservation: Reservation) => {
        if (reservation.status === 'pending' && reservation.timeSlot) {
            return reservation.timeSlot.startTime !== "Hora no disponible"
                ? reservation.timeSlot.startTime.slice(0, 5)
                : "Hora no disponible";
        }

        if (reservation.event?.schedule) {
            return dayjs(reservation.event.schedule).format("HH:mm");
        }

        return "Hora no disponible";
    };

    const pendingReservations = reservations
        .filter(r => r.status === 'pending')
        .sort((a, b) => {
            const dateA = a.timeSlot?.availabilityDate || "";
            const dateB = b.timeSlot?.availabilityDate || "";
            const timeA = a.timeSlot?.startTime || "";
            const timeB = b.timeSlot?.startTime || "";

            return dayjs(`${dateA} ${timeA}`).valueOf() - dayjs(`${dateB} ${timeB}`).valueOf();
        });

    const now = dayjs();

    const upcomingReservations = reservations
        .filter(r => r.status === 'confirmed' && dayjs(r.event.schedule).isAfter(now))
        .sort((a, b) => dayjs(a.event.schedule).valueOf() - dayjs(b.event.schedule).valueOf());

    const isToday = (dateStr: string) => {
        const today = dayjs().startOf('day'); // Tomar el inicio del día actual
        const givenDate = dayjs(dateStr).startOf('day'); // Convertir la fecha de la reserva
        return today.isSame(givenDate, 'day');
    };

    const isTomorrow = (dateStr: string) => {
        const tomorrow = dayjs().add(1, 'day').startOf('day');
        const givenDate = dayjs(dateStr).startOf('day');
        return tomorrow.isSame(givenDate, 'day');
    };


    const getRelativeDate = (reservation: Reservation) => {
        if (!reservation) return "Reserva indefinida";

        let date = "";

        if (reservation.status === 'pending' && reservation.timeSlot) {
            date = reservation.timeSlot.availabilityDate;
        }

        else if (reservation.event?.schedule) {
            date = reservation.event.schedule;
        }

        if (!date) return "Fecha no disponible";

        if (isToday(date)) return "Hoy";
        if (isTomorrow(date)) return "Mañana";

        return formatDate(date);
    };


    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-6">Inicio</h1>
            {loading ? (
                <p className="text-center text-gray-500">Cargando reservas...</p>
            ) : (
                <>
                    <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Reservas pendientes de aprobación</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {pendingReservations.length === 0 ? (
                            <div className="col-span-full">
                                <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                            </div>
                        ) : (
                            pendingReservations.map((reservation: Reservation) => (
                                <Card key={`reservation-${reservation.id}`}
                                      className="p-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-semibold text-lg mb-1">{reservation.field.name}</h3>
                                    <div className="space-y-1">
                                        <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                                        <p className="text-gray-600">{formatTime(reservation)} hs</p>
                                        <div className=" border-gray-300 mt-2 pt-2 text-right">
                                            <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">{reservation.event.ownerName}</p>
                                            <p className="text-gray-600">
                                                {reservation.event.ownerName && reservation.event.ownerPhone ? (
                                                    <a
                                                        href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
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
                                    <div className="mt4 flex gap-2">
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
                                </Card>
                            ))
                        )}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Próximas reservas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {upcomingReservations.length === 0 ? (
                            <div className="col-span-full">
                                <Card className="p-6 text-center text-gray-500">No hay próximas reservas</Card>
                            </div>
                        ) : (
                            upcomingReservations.map((reservation: Reservation) => (
                                <Card key={`confirmed-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-semibold text-lg mb-1">{reservation.field.name}</h3>
                                    <div className="space-y-1">
                                        <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                                        <p className="text-gray-600">{formatTime(reservation)} hs</p>
                                        <div className=" border-gray-300 mt-2 pt-2 text-right">
                                            <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">{reservation.event.ownerName}</p>
                                            <p className="text-gray-600">
                                                {reservation.event.ownerName && reservation.event.ownerPhone ? (
                                                    <a
                                                        href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
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
                </>
            )}
        </div>

    );
};
