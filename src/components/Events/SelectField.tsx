import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import apiClient from '@/apiClients';
import dayjs from 'dayjs';
import { ClockIcon, Users } from 'lucide-react';
import {Field} from "../../types/fields";
import { useNavigate } from 'react-router-dom';
import styles from './Events.module.css';

interface SelectFieldProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    eventId: number;
    sportId: number;
    date: string;
    duration: number;
}

interface FieldWithTimeSlots extends Field {
    availableSlots: { timeSlotId: number; startTime: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({ isOpen, onClose, onSuccess, sportId, date, eventId }) => {
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

            let formattedTime = selectedField.startTime;
            
            if (selectedField.startTime.includes('T')) {
                formattedTime = dayjs(selectedField.startTime).format('HH:mm');
            } 
            else if (selectedField.startTime.split(':').length > 2) {
                formattedTime = selectedField.startTime.split(':').slice(0, 2).join(':');
            }

            await apiClient.patch(`/events/${eventId}`, {
                description: selectedField.name,
                schedule: formattedTime,
            }, {
                headers: { 'c-api-key': apiKey, 'x-auth-type': 'club' }
            });
            
            if (onSuccess) {
                onSuccess();
            } else {
                onClose();
            }
            
            navigate('/events');
        } catch (error) {
            console.error('❌ Error al reservar la cancha:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
                <h2 className={styles.modalTitle}>Seleccionar Cancha</h2>

                {loading ? (
                    <div className={styles.loadingSpinner}>
                        <p className={styles.loadingText}>Buscando canchas disponibles...</p>
                    </div>
                ) : fields.length === 0 ? (
                    <div className={styles.emptyState}>No hay canchas disponibles en este horario.</div>
                ) : (
                    <div className="space-y-4">
                        {fields.map(field => (
                            <div key={field.id} className={styles.eventCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{field.name}</h3>
                                    <p className="flex items-center text-gray-600">
                                        <Users className="w-4 h-4 mr-1"/> Capacidad: {field.capacity} personas
                                    </p>
                                </div>

                                {/* Lista de horarios disponibles */}
                                <div className={styles.cardContent}>
                                    {field.availableSlots.length === 0 ? (
                                        <p className="text-sm text-gray-500">No hay horarios disponibles.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {field.availableSlots.map(slot => (
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
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Botón de Confirmación */}
                <div className={styles.formActions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.createButton}
                        onClick={handleConfirmSelection}
                        disabled={!selectedField}
                    >
                        Confirmar cancha
                    </button>
                </div>
            </div>
        </div>
    );
};
