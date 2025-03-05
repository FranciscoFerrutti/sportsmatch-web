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

    const [sports, setSports] = useState([]);
    const [formData, setFormData] = useState({
        sportId: '',
        expertise: '',
        date: '',
        location: '',
        players: '2',
        duration: '60',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSports();
        }
    }, [isOpen]);

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchFields = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const eventPayload = {
                sportId: parseInt(formData.sportId),
                expertise: parseInt(formData.expertise),
                schedule: formData.date,
                location: "CABA",
                remaining: parseInt(formData.players),
                duration: parseInt(formData.duration),
                description: formData.description || " ",
            };

            // Crear evento y obtener su ID
            const response = await apiClient.post('/events', eventPayload, {
                headers: {
                    'c-api-key': apiKey
                }
            });

            if (response.data?.eventId) {
                setCreatedEventId(response.data.eventId);
                setIsSelectFieldModalOpen(true);
            }
        } catch (error) {
            console.error('❌ Error al crear el evento:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-[#000066]">Nuevo Evento</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                    <Input name="date" type="date" value={formData.date} onChange={handleInputChange} required/>

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
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-[#000066] hover:bg-[#000088] text-white" disabled={loading}>
                            {loading ? 'Buscando...' : 'Buscar cancha'}
                        </Button>
                    </div>
                </form>
            </Card>
            {/* Modal de selección de canchas */}
            {isSelectFieldModalOpen && createdEventId && (
                <SelectField
                    isOpen={isSelectFieldModalOpen}
                    onClose={() => setIsSelectFieldModalOpen(false)}
                    eventId={Number(createdEventId)}
                    sportId={Number(formData.sportId)}
                    date={formData.date}
                    duration={Number(formData.duration)}
                />
            )}
        </div>
    );
};
