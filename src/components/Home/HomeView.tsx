import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import {Field} from "../../types/fields.ts";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

export const HomeView = () => {

    const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
    const [confirmedReservations, setConfirmedReservations] = useState<Reservation[]>([]);
    const [fieldNames, setFieldNames] = useState<{ [key: number]: string }>({});

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
            const allReservations: Reservation[] = response.data;

            setPendingReservations(
                allReservations
                    .filter(r => r.status === 'pending')
                    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
            );

            setConfirmedReservations(
                allReservations
                    .filter(r => r.status === 'confirmed')
                    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
                    .slice(0, 5)
            );

            const fieldIds = [...new Set(allReservations.map(r => r.fieldId))];
            fetchFieldNames(fieldIds, apiKey);

        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchFieldNames = async (fieldIds: number[], apiKey: string) => {
        try {
            const fieldPromises = fieldIds.map(fieldId =>
                apiClient.get(`/fields/${fieldId}`, { headers: { 'c-api-key': apiKey } })
            );
            const fieldResponses = await Promise.all(fieldPromises);

            const fieldData: { [key: number]: string } = {};
            fieldResponses.forEach(res => {
                const field: Field = res.data;
                fieldData[field.id] = field.name;
            });

            setFieldNames(fieldData);
        } catch (error) {
            console.error('Error fetching field names:', error);
        }
    };

    const handleAccept = async (reservationId: number) => {
        try {
            const apiKey = localStorage.getItem('c-api-key');
            if (!apiKey) {
                console.error('Error: API Key no encontrada en localStorage');
                return;
            }

            await apiClient.patch(`/reservations/${reservationId}/status`, {
                status: 'confirmed'
            }, {
                headers: { 'c-api-key': apiKey },
            });

            // 🔄 Volver a obtener las reservas después de aceptar
            fetchReservations();

        } catch (error) {
            console.error('Error al aceptar la reserva:', error);
            alert('No se pudo aceptar la reserva.');
        }
    };

    const handleReject = async (reservationId: number) => {
        try {
            const apiKey = localStorage.getItem('c-api-key');
            if (!apiKey) {
                console.error('Error: API Key no encontrada en localStorage');
                return;
            }

            await apiClient.patch(`/reservations/${reservationId}/status`, {
                status: 'cancelled'
            }, {
                headers: { 'c-api-key': apiKey },
            });

            // 🔄 Volver a obtener las reservas después de rechazar
            fetchReservations();

        } catch (error) {
            console.error('Error al rechazar la reserva:', error);
            alert('No se pudo rechazar la reserva.');
        }
    };

    const handleCancelReservation = async (reservationId: number) => {
        try {
            const apiKey = localStorage.getItem('c-api-key');
            if (!apiKey) {
                console.error('Error: API Key no encontrada en localStorage');
                return;
            }

            await apiClient.delete(`/reservations/${reservationId}`, {
                headers: {
                    'c-api-key': apiKey,
                    'x-auth-type': 'club'
                },
            });

            fetchReservations();

        } catch (error) {
            console.error('Error al cancelar la reserva:', error);
            alert('No se pudo cancelar la reserva.');
        }
    };


    const formatDate = (dateStr: string) => {
        const formatted = dayjs(dateStr).locale('es').format('dddd D [de] MMMM [de] YYYY');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };


    const formatTime = (time?: string) => time ? time.slice(0, 5) : "Hora no disponible";

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
        // Verificar que `reservation` y `timeSlots` existen
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
            <h1 className="text-xl font-semibold mb-6">Inicio</h1>

            <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Reservas pendientes de aprobación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingReservations.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                        </div>
                    ) : (
                        pendingReservations.map((reservation: Reservation) => (
                                <Card key={`reservation-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{fieldNames[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
                                        <div className="space-y-1">
                                            <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                                            <p className="text-gray-600">
                                                {reservation.timeSlots && reservation.timeSlots.length > 0
                                                    ? formatTime(reservation.timeSlots[0].startTime) + " hs"
                                                    : "Hora no disponible"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                            onClick={() => {
                                                handleAccept(reservation.id);
                                            }}
                                        >
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
                    {confirmedReservations.length === 0 ? (
                        <div className="col-span-full">
                            <Card className="p-6 text-center text-gray-500">No hay próximas reservas</Card>
                        </div>
                    ) : (
                        confirmedReservations.map((reservation: Reservation) => (
                                <Card key={`confirmed-${reservation.id}`} className="p-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-semibold text-lg mb-1">{fieldNames[reservation.fieldId] || `Cancha ${reservation.fieldId}`}</h3>
                                    <div className="space-y-1">
                                        <p className="text-gray-600">{getRelativeDate(reservation)}</p>
                                        <p className="text-gray-600">
                                            {reservation.timeSlots && reservation.timeSlots.length > 0
                                                ? formatTime(reservation.timeSlots[0].startTime) + " hs"
                                                : "Hora no disponible"}
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                            onClick={() => handleCancelReservation(reservation.id)}
                                        >
                                            Cancelar reserva
                                        </Button>
                                    </div>
                                </Card>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};
