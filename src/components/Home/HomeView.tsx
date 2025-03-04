import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import { useAuth } from "../../context/AppContext.tsx";
import { UserCircle } from 'lucide-react';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(isToday);
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

    useEffect(() => {
        fetchReservations();
    }, [clubId, apiKey]);

    // Función para verificar si una fecha es hoy
    const isDateToday = (dateString: string | undefined) => {
        if (!dateString) return false;
        const today = dayjs().format('YYYY-MM-DD');
        return dayjs(dateString).format('YYYY-MM-DD') === today;
    };

    // Función para verificar si una fecha es actual o futura
    const isDateCurrentOrFuture = (dateString: string | undefined) => {
        if (!dateString) return false;
        const today = dayjs().format('YYYY-MM-DD');
        const date = dayjs(dateString).format('YYYY-MM-DD');
        return date >= today;
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
            <h1 className="text-2xl font-bold text-[#000066]">Inicio</h1>

            {loading ? (
                <p className="text-center text-gray-500">Cargando reservas...</p>
            ) : (
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* 🔹 Reservas Pendientes */}
                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">📌 Reservas Pendientes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.filter(r => r.status === 'pending' && isDateCurrentOrFuture(r.timeSlot?.availabilityDate)).length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
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
                                        <Card key={`reservation-${reservation.id}`}
                                              className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                                            <CardHeader>
                                                <CardTitle>{reservation.field.name}</CardTitle>
                                                <p className="text-gray-600">{dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}</p>
                                                <p className="text-gray-600">{reservation.timeSlot?.startTime} hs</p>
                                            </CardHeader>

                                            <CardContent>
                                                <div
                                                    className="border-t border-gray-300 pt-2 text-right flex justify-end items-center gap-3">
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <UserCircle className="w-14 h-14 text-gray-400"/>
                                                    )}
                                                    <div>
                                                        <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">
                                                            {reservation.event.ownerName}
                                                        </p>
                                                        <p className="text-gray-600">
                                                            {reservation.event.ownerPhone ? (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-800 underline hover:text-blue-600"
                                                                >
                                                                    Enviar mensaje
                                                                </a>
                                                            ) : 'Sin teléfono'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="flex justify-between">
                                                <Button
                                                    className="bg-green-500 text-white hover:bg-green-600"
                                                    onClick={() => handleAccept(reservation.id)}
                                                >Aceptar</Button>
                                                <Button
                                                    className="bg-red-500 text-white hover:bg-red-600"
                                                    onClick={() => handleReject(reservation.id)}
                                                >Rechazar</Button>
                                            </CardFooter>
                                        </Card>
                                    ))
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">📅 Reservas del Día de Hoy</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.filter(r => r.status === 'confirmed' && isDateToday(r.timeSlot?.availabilityDate)).length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay reservas para hoy</Card>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'confirmed' && isDateToday(r.timeSlot?.availabilityDate))
                                    .sort((a, b) =>
                                        dayjs(`2000-01-01T${a.timeSlot?.startTime}`).valueOf() -
                                        dayjs(`2000-01-01T${b.timeSlot?.startTime}`).valueOf()
                                    )
                                    .map((reservation: Reservation) => (
                                        <Card key={`confirmed-${reservation.id}`}
                                              className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                                            <CardHeader>
                                                <CardTitle>{reservation.field.name}</CardTitle>
                                                <p className="text-gray-600">{dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}</p>
                                                <p className="text-gray-600">{reservation.timeSlot?.startTime} hs</p>
                                            </CardHeader>

                                            <CardContent>
                                                <div
                                                    className="border-t border-gray-300 pt-2 text-right flex justify-end items-center gap-3">
                                                    {reservation.event.ownerImage ? (
                                                        <img
                                                            src={reservation.event.ownerImage}
                                                            alt="Owner"
                                                            className="w-14 h-14 rounded-full object-cover border"
                                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                                        />
                                                    ) : (
                                                        <UserCircle className="w-14 h-14 text-gray-400"/>
                                                    )}
                                                    <div>
                                                        <p className="text-md font-semibold bg-blue-50 text-blue-800 px-2 py-1 rounded-md inline-block">
                                                            {reservation.event.ownerName}
                                                        </p>
                                                        <p className="text-gray-600">
                                                            {reservation.event.ownerPhone ? (
                                                                <a
                                                                    href={`https://api.whatsapp.com/send?phone=${reservation.event.ownerPhone.replace('+', '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-800 underline hover:text-blue-600"
                                                                >
                                                                    Enviar mensaje
                                                                </a>
                                                            ) : 'Sin teléfono'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="flex justify-end">
                                                <Button className="bg-red-500 text-white hover:bg-red-600">Cancelar
                                                    Reserva</Button>
                                            </CardFooter>
                                        </Card>
                                    ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};