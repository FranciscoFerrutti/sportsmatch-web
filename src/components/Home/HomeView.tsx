import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Reservation } from '@/types/reservation';
import { useAuth } from "../../context/AppContext.tsx";

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


    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
            <h1 className="text-3xl font-extrabold text-[#000066] text-center mb-10">Inicio</h1>

            {loading ? (
                <p className="text-center text-gray-500">Cargando reservas...</p>
            ) : (
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* 🔹 Reservas Pendientes */}
                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">📌 Reservas Pendientes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.filter(r => r.status === 'pending').length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay reservas pendientes</Card>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'pending')
                                    .map((reservation: Reservation) => (
                                        <Card key={`reservation-${reservation.id}`} className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                                            <CardHeader>
                                                <CardTitle>{reservation.field.name}</CardTitle>
                                                <p className="text-gray-600">{dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}</p>
                                                <p className="text-gray-600">{dayjs(reservation.event.schedule).format("HH:mm")} hs</p>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="border-t border-gray-300 pt-2 text-right">
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
                                            </CardContent>

                                            <CardFooter className="flex justify-between">
                                                <Button className="bg-green-500 text-white hover:bg-green-600">Aceptar</Button>
                                                <Button className="bg-red-500 text-white hover:bg-red-600">Rechazar</Button>
                                            </CardFooter>
                                        </Card>
                                    ))
                            )}
                        </div>
                    </section>

                    {/* 🔹 Próximas Reservas */}
                    <section>
                        <h2 className="text-xl font-semibold text-[#000066] mb-4">📅 Próximas Reservas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.filter(r => r.status === 'confirmed').length === 0 ? (
                                <Card className="p-6 text-center text-gray-500">No hay próximas reservas</Card>
                            ) : (
                                reservations
                                    .filter(r => r.status === 'confirmed')
                                    .map((reservation: Reservation) => (
                                        <Card key={`confirmed-${reservation.id}`} className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                                            <CardHeader>
                                                <CardTitle>{reservation.field.name}</CardTitle>
                                                <p className="text-gray-600">{dayjs(reservation.timeSlot?.availabilityDate).format("DD/MM/YYYY")}</p>
                                                <p className="text-gray-600">{dayjs(reservation.event.schedule).format("HH:mm")} hs</p>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="border-t border-gray-300 pt-2 text-right">
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
                                            </CardContent>

                                            <CardFooter className="flex justify-end">
                                                <Button className="bg-red-500 text-white hover:bg-red-600">Cancelar Reserva</Button>
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