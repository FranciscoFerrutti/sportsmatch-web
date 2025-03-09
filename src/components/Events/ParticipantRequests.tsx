import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import apiClient from '@/apiClients';
import { Participant } from '@/types/participant';
import { Check, X, User, Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ParticipantRequestsProps {
    eventId: number;
    onRequestsChange?: () => void;
}

export const ParticipantRequests = ({ eventId, onRequestsChange }: ParticipantRequestsProps) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiKey = localStorage.getItem('c-api-key');

    const fetchParticipants = async () => {
        if (!apiKey) {
            setError('API Key no encontrada');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.get<Participant[]>(
                `/events/${eventId}/participants?status=pending`, 
                { 
                    headers: { 
                        'c-api-key': apiKey,
                        'x-auth-type': 'club'
                    } 
                }
            );

            if (response.data && Array.isArray(response.data)) {
                setParticipants(response.data);
            } else {
                setParticipants([]);
            }
            setError(null);
        } catch (err) {
            console.error('Error al obtener solicitudes de participantes:', err);
            setError('Error al cargar las solicitudes');
            setParticipants([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchParticipants();
        }
    }, [eventId]);

    const handleAccept = async (userId: string) => {
        if (!apiKey) return;

        try {
            await apiClient.put(
                `/events/${eventId}/participants/${userId}`,
                { status: true },
                { 
                    headers: { 
                        'c-api-key': apiKey,
                        'x-auth-type': 'club',
                        'Content-Type': 'application/json'
                    } 
                }
            );
            
            // Remove from list or refresh
            setParticipants(participants.filter(p => p.userId !== userId));
            if (onRequestsChange) onRequestsChange();
        } catch (err) {
            console.error('Error al aceptar participante:', err);
        }
    };

    const handleReject = async (userId: string) => {
        if (!apiKey) return;

        try {
            await apiClient.delete(
                `/events/${eventId}/participants/${userId}`,
                { 
                    headers: { 
                        'c-api-key': apiKey,
                        'x-auth-type': 'club'
                    } 
                }
            );
            
            // Remove from list or refresh
            setParticipants(participants.filter(p => p.userId !== userId));
            if (onRequestsChange) onRequestsChange();
        } catch (err) {
            console.error('Error al rechazar participante:', err);
        }
    };

    if (loading) {
        return <div className="text-center py-4">Cargando solicitudes...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-4">{error}</div>;
    }

    if (participants.length === 0) {
        return <div className="text-center text-gray-500 py-4">No hay solicitudes pendientes</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Solicitudes pendientes ({participants.length})</h3>
            
            <div className="space-y-3">
                {participants.map((participant) => (
                    <Card key={participant.userId} className="overflow-hidden">
                        <div className="flex items-center p-4">
                            <div className="flex-shrink-0 mr-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {participant.firstname.charAt(0)}{participant.lastname.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            
                            <div className="flex-grow">
                                <h4 className="font-medium">{participant.firstname} {participant.lastname}</h4>
                                <div className="flex items-center text-sm text-gray-500 space-x-2">
                                    {participant.phoneNumber && (
                                        <p>{participant.phoneNumber}</p>
                                    )}
                                    {participant.rating && (
                                        <div className="flex items-center">
                                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                            <span>{participant.rating.rate.toFixed(1)} ({participant.rating.count})</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button 
                                    onClick={() => handleAccept(participant.userId)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                    onClick={() => handleReject(participant.userId)}
                                    size="sm"
                                    variant="destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};