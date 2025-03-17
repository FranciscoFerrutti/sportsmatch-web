import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import apiClient from '@/apiClients';
import { Participant } from '@/types/participant';
import { Star, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import styles from './Events.module.css';

interface AcceptedParticipantsProps {
    eventId: number;
}

export const AcceptedParticipants = ({ eventId }: AcceptedParticipantsProps) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiKey = localStorage.getItem('c-api-key');

    const fetchAcceptedParticipants = async () => {
        if (!apiKey) {
            setError('API Key no encontrada');
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.get<Participant[]>(
                `/events/${eventId}/participants?status=accepted`, 
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
            console.error('Error al obtener participantes aceptados:', err);
            setError('Error al cargar los participantes');
            setParticipants([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchAcceptedParticipants();
        }
    }, [eventId]);

    const handleContact = (participant: Participant) => {
        // Open phone dialer
        if (participant.phoneNumber) {
            window.open(`tel:${participant.phoneNumber}`, '_blank');
        }
    };

    if (loading) {
        return <div className="text-center py-2 text-sm">Cargando participantes...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-2 text-sm">{error}</div>;
    }

    return (
        <div className="w-full">
            {participants.length === 0 ? (
                <div className="text-center text-gray-500 py-2 text-xs">No hay participantes</div>
            ) : (
                <div className="space-y-2">
                    {participants.map((participant) => (
                        <Card key={participant.userId} className="overflow-hidden border-gray-200">
                            <div className={styles.participantItem}>
                                <div className={styles.participantInfo}>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {participant.firstname.charAt(0)}{participant.lastname.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <h4 className={styles.participantName}>{participant.firstname} {participant.lastname}</h4>
                                        <div className="flex flex-col text-xs text-gray-500">
                                            {participant.phoneNumber && (
                                                <p className="text-xs">{participant.phoneNumber}</p>
                                            )}
                                            {participant.rating && (
                                                <div className="flex items-center">
                                                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                                    <span className="text-xs">{participant.rating.rate.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {participant.phoneNumber && (
                                    <button
                                        onClick={() => handleContact(participant)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                    >
                                        <Phone className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}; 