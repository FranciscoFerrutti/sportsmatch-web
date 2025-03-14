import React, { useState, useEffect } from 'react';
import apiClient from '@/apiClients';
import { X } from 'lucide-react';
import {SelectField} from "./SelectField.tsx";
import styles from './Events.module.css';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewEvent: React.FC<EventModalProps> = ({ isOpen, onClose }) => {
    const apiKey = localStorage.getItem('c-api-key');
    const [isSelectFieldModalOpen, setIsSelectFieldModalOpen] = useState(false);
    const [createdEventId, setCreatedEventId] = useState<string | null>(null);
    const [dateError, setDateError] = useState<string | null>(null);

    const [sports, setSports] = useState([]);
    const [formData, setFormData] = useState({
        sportId: '',
        expertise: '',
        date: '',
        time: '',
        location: '',
        players: '2',
        duration: '60',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    
    // Calculate the maximum allowed date (14 days from today)
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 14);
    
    // Format the max date as YYYY-MM-DD for the date input
    const formatDateForInput = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Generate time options in 30-minute increments
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            const hourFormatted = hour.toString().padStart(2, '0');
            options.push(`${hourFormatted}:00`);
            options.push(`${hourFormatted}:30`);
        }
        return options;
    };
    
    const timeOptions = generateTimeOptions();

    useEffect(() => {
        if (isOpen) {
            fetchSports();
        }
    }, [isOpen]);

    // Log when createdEventId changes
    useEffect(() => {
        if (createdEventId) {
            console.log('🔔 Event ID state updated:', createdEventId);
        }
    }, [createdEventId]);

    const fetchSports = async () => {
        try {
            const response = await apiClient.get('/sports', { headers: { 'c-api-key': apiKey } });
            setSports(response.data);
        } catch (error) {
            console.error('❌ Error al obtener deportes:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Clear date error when user changes the date
        if (name === 'date') {
            setDateError(null);
            
            // Validate if the selected date is within the allowed range
            if (value) {
                const selectedDate = new Date(value);
                if (selectedDate > maxDate) {
                    setDateError(`Solo puedes crear eventos hasta ${formatDateForInput(maxDate)} (14 días desde hoy)`);
                }
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchFields = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if the date is valid before proceeding
        if (formData.date) {
            const selectedDate = new Date(formData.date);
            if (selectedDate > maxDate) {
                setDateError(`Solo puedes crear eventos hasta ${formatDateForInput(maxDate)} (14 días desde hoy)`);
                return;
            }
        }
        
        setLoading(true);

        try {
            // Combine date and time into a single schedule field
            const scheduleDateTime = formData.date && formData.time 
                ? `${formData.date}T${formData.time}:00` 
                : formData.date;
                
            const eventPayload = {
                sportId: parseInt(formData.sportId),
                expertise: parseInt(formData.expertise),
                schedule: scheduleDateTime,
                location: "CABA",
                remaining: parseInt(formData.players),
                duration: parseInt(formData.duration),
                description: formData.description || " ",
            };

            console.log('📤 Creating event with payload:', eventPayload);

            // Crear evento y obtener su ID
            const response = await apiClient.post('/events', eventPayload, {
                headers: {
                    'c-api-key': apiKey,
                    'x-auth-type': 'club'
                }
            });

            if (response.data?.eventId) {
                console.log('✅ Event created successfully with ID:', response.data.eventId);
                setCreatedEventId(response.data.eventId);
                setIsSelectFieldModalOpen(true);
            } else {
                console.error('❌ No event ID returned from API');
            }
        } catch (error) {
            console.error('❌ Error al crear el evento:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAllModals = () => {
        // We don't want to delete the event here because this function is called
        // when the user successfully completes the booking process
        // The event should remain in the database
        console.log('✅ Booking process completed successfully, keeping event with ID:', createdEventId);
        
        setIsSelectFieldModalOpen(false);
        onClose();
        window.location.reload();
    };

    // Function to handle cancellation of the SelectField modal
    const handleCancelSelectField = () => {
        // If the user cancels the SelectField modal, we should delete the event
        if (createdEventId) {
            console.log('🔄 User cancelled field selection, deleting event with ID:', createdEventId);
            
            // Delete the event that was created
            apiClient.delete(`/events/${createdEventId}`, {
                headers: {
                    'c-api-key': apiKey,
                    'x-auth-type': 'club'
                }
            })
            .then(() => {
                console.log(`✅ Event ${createdEventId} deleted successfully`);
            })
            .catch(error => {
                console.error('❌ Error deleting event:', error);
            })
            .finally(() => {
                setIsSelectFieldModalOpen(false);
                setCreatedEventId(null);
                // Don't close the main modal, just the field selection
            });
        } else {
            setIsSelectFieldModalOpen(false);
            // Don't close the main modal
        }
    };

    // Function to delete the event if modal is closed
    const handleClose = () => {
        if (createdEventId) {
            console.log('🔄 Attempting to delete event with ID:', createdEventId);
            
            // Delete the event that was created
            apiClient.delete(`/events/${createdEventId}`, {
                headers: {
                    'c-api-key': apiKey,
                    'x-auth-type': 'club'
                }
            })
            .then(() => {
                console.log(`✅ Event ${createdEventId} deleted successfully`);
            })
            .catch(error => {
                console.error('❌ Error deleting event:', error);
            })
            .finally(() => {
                // Always call onClose to ensure the modal closes
                onClose();
            });
        } else {
            console.log('ℹ️ No event to delete, just closing modal');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={styles.modalTitle}>Nuevo Evento</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearchFields} className="space-y-4">
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Deporte:</label>
                        <select
                            className={styles.formSelect}
                            name="sportId"
                            value={formData.sportId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Seleccionar deporte</option>
                            {sports.map((sport: any) => (
                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nivel:</label>
                        <select
                            className={styles.formSelect}
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Seleccionar nivel</option>
                            <option value="1">Principiante</option>
                            <option value="2">Intermedio</option>
                            <option value="3">Avanzado</option>
                            <option value="4">Profesional</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Fecha:</label>
                        <input
                            className={styles.formInput}
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            min={formatDateForInput(today)}
                            max={formatDateForInput(maxDate)}
                            required
                        />
                        {dateError && (
                            <div className={styles.formError}>{dateError}</div>
                        )}
                        <div className={styles.formHelp}>
                            Solo puedes crear eventos hasta 14 días desde hoy.
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Hora:</label>
                        <select
                            className={styles.formSelect}
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Seleccionar hora</option>
                            {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                    {time}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Participantes faltantes:</label>
                        <input
                            className={styles.formInput}
                            name="players"
                            type="number"
                            min="1"
                            max="50"
                            step="1"
                            value={formData.players}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Duración:</label>
                        <input
                            className={styles.formInput}
                            name="duration"
                            type="number"
                            min="30"
                            max="300"
                            step="30"
                            value={formData.duration}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Descripción:</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            rows={3}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleClose}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.createButton}
                            disabled={!formData.sportId || !formData.expertise || !formData.date || !formData.time || !formData.players || !formData.duration || loading || !!dateError}
                        >
                            {loading ? 'Buscando...' : 'Buscar cancha'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de selección de canchas */}
            {isSelectFieldModalOpen && createdEventId && (
                <SelectField
                    isOpen={isSelectFieldModalOpen}
                    onClose={handleCancelSelectField}
                    onSuccess={handleCloseAllModals}
                    eventId={Number(createdEventId)}
                    sportId={Number(formData.sportId)}
                    date={formData.date && formData.time ? `${formData.date}T${formData.time}:00` : formData.date}
                    duration={Number(formData.duration)}
                />
            )}
        </div>
    );
};
