import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import apiClient from '@/apiClients';
import { X } from 'lucide-react';
import {SelectField} from "./SelectField.tsx";

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-[#000066]">Nuevo Evento</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSearchFields} className="space-y-4">
                    <h3 className="text-m font-semibold text-[#000066] mb-2">Deporte:</h3>
                    <Select name="sportId" value={formData.sportId} onChange={handleInputChange} required>
                        <option value="">Seleccionar deporte</option>
                        {sports.map((sport: any) => (
                            <option key={sport.id} value={sport.id}>{sport.name}</option>
                        ))}
                    </Select>

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Nivel:</h3>
                    <Select name="expertise" value={formData.expertise} onChange={handleInputChange} required>
                        <option value="">Seleccionar nivel</option>
                        <option value="1">Principiante</option>
                        <option value="2">Intermedio</option>
                        <option value="3">Avanzado</option>
                        <option value="4">Profesional</option>
                    </Select>

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Fecha:</h3>
                    <Input 
                        name="date" 
                        type="date" 
                        value={formData.date} 
                        onChange={handleInputChange} 
                        min={formatDateForInput(today)}
                        max={formatDateForInput(maxDate)}
                        required
                    />
                    {dateError && (
                        <div className="text-red-500 text-sm mt-1">{dateError}</div>
                    )}
                    <div className="text-[#000066] text-sm mt-1">
                        Solo puedes crear eventos hasta 14 días desde hoy.
                    </div>

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Hora:</h3>
                    <Select name="time" value={formData.time} onChange={handleInputChange} required>
                        <option value="">Seleccionar hora</option>
                        {timeOptions.map((time) => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </Select>

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Participantes faltantes:</h3>
                    <Input
                        name="players"
                        type="number"
                        min="1"
                        max="50"
                        step="1"
                        value={formData.players}
                        onChange={handleInputChange}
                        required
                    />

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Duración:</h3>
                    <Input
                        name="duration"
                        type="number"
                        min="30"
                        max="300"
                        step="30"
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                    />

                    <h3 className="text-m font-semibold text-[#000066] mb-2">Descripción:</h3>
                    <textarea name="description" value={formData.description} onChange={handleInputChange}
                              className="w-full p-2 border rounded" rows={3}/>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                        <Button 
                            type="submit" 
                            className="bg-[#000066] hover:bg-[#000088] text-white" 
                            disabled={loading || !!dateError}
                        >
                            {loading ? 'Buscando...' : 'Buscar cancha'}
                        </Button>
                    </div>
                </form>
            </Card>
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
