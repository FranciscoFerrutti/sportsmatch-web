import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import { ClockIcon, Users } from 'lucide-react';
import {Field} from "../../types/fields";
import { useNavigate } from 'react-router-dom';

interface SelectFieldProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    sportId: number;
    date: string;
    duration: number;
}

interface FieldWithTimeSlots extends Field {
    availableSlots: { timeSlotId: number; startTime: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({ isOpen, onClose, sportId, date }) => {
    const { clubId } = useAuth();
    const apiKey = localStorage.getItem('c-api-key');

    const [fields, setFields] = useState<FieldWithTimeSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedField, setSelectedField] = useState<{ id: number; name: string; capacity: number; timeSlotId: number; startTime: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchAvailableFields();
        }
    }, [isOpen]);

    const fetchAvailableFields = async () => {
        setLoading(true);

        try {
            const response = await apiClient.get('/fields', {
                headers: { 'c-api-key': apiKey },
                params: { clubId } // 🔹 Solo canchas dentro del club del usuario
            });

            const allFields = response.data;

            if (!Array.isArray(allFields) || allFields.length === 0) {
                console.warn("⚠️ No se recibieron canchas desde el servidor.");
                setFields([]);
                return;
            }

            const filteredFields = allFields.filter(field =>
                field.sports.some((sport: { id: number }) => sport.id === sportId)
            );

            let formattedFields: FieldWithTimeSlots[] = [];

            for (const field of filteredFields) {
                const availableSlotsResponse = await apiClient.get(`/fields/${field.id}/availability/available`, {
                    headers: { 'c-api-key': apiKey },
                    params: { startDate: date, endDate: date }
                });

                const availableSlots = availableSlotsResponse.data.map((slot: { id: number; start_time: string }) => ({
                    timeSlotId: slot.id,
                    startTime: slot.start_time
                }));

                formattedFields.push({
                    ...field,
                    availableSlots: availableSlots
                });
            }

            setFields(formattedFields);
        } catch (error) {
            console.error("❌ Error obteniendo canchas:", error);
            setFields([]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSelection = async () => {
        if (!selectedField) return;

        try {
            await apiClient.patch(`/fields/${selectedField.id}/availability/${selectedField.timeSlotId}/status`, {
                slotStatus: "booked"
            }, {
                headers: { 'c-api-key': apiKey }
            });

            onClose();
            navigate('/events');
        } catch (error) {
            console.error('❌ Error al reservar la cancha:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border">
                <h2 className="text-2xl font-semibold text-[#000066] mb-4">Seleccionar Cancha</h2>

                {loading ? (
                    <p className="text-center text-gray-500">Buscando canchas disponibles...</p>
                ) : fields.length === 0 ? (
                    <p className="text-center text-gray-500">No hay canchas disponibles en este horario.</p>
                ) : (
                    <div className="space-y-4">
                        {fields.map(field => (
                            <div key={field.id} className="border p-4 rounded-lg shadow-md">
                                <p className="text-lg font-semibold text-[#000066]">{field.name}</p>
                                <p className="text-gray-600 flex items-center">
                                    <Users className="w-4 h-4 mr-1"/> Capacidad: {field.capacity} personas
                                </p>

                                {/* Lista de horarios disponibles */}
                                <div className="mt-2 space-y-2">
                                    {field.availableSlots.length === 0 ? (
                                        <p className="text-sm text-gray-500">No hay horarios disponibles.</p>
                                    ) : (
                                        field.availableSlots.map(slot => (
                                            <button
                                                key={slot.timeSlotId}
                                                className={`w-full p-2 border rounded-lg text-left ${selectedField?.timeSlotId === slot.timeSlotId ? "border-blue-600 bg-blue-100" : "border-gray-300"}`}
                                                onClick={() => setSelectedField({
                                                    id: field.id,
                                                    name: field.name,
                                                    capacity: field.capacity,
                                                    timeSlotId: slot.timeSlotId,
                                                    startTime: slot.startTime
                                                })}
                                            >
                                                <ClockIcon className="w-4 h-4 mr-1 inline"/>
                                                {dayjs(`2025-01-01T${slot.startTime}`).format("HH:mm")} hs
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Botón de Confirmación */}
                <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={onClose}
                            className="border-blue-500 text-blue-700 hover:bg-blue-100">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmSelection} className="bg-[#000066] hover:bg-[#000088] text-white"
                            disabled={!selectedField}>
                        Confirmar Reserva
                    </Button>
                </div>
            </Card>
        </div>
    );
};
