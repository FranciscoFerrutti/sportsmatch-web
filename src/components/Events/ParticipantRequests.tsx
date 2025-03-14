import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import apiClient from '@/apiClients';
import { Participant } from '@/types/participant';
import { Check, X, Star, Phone } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import styles from './Events.module.css';

interface ParticipantRequestsProps {
    eventId: number;
    onRequestsChange?: (action: 'accept' | 'reject') => void;
}

export const ParticipantRequests = ({ eventId, onRequestsChange }: ParticipantRequestsProps) => {
    const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
    const [acceptedParticipants, setAcceptedParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiKey = localStorage.getItem('c-api-key');

    const fetchParticipants = async (status: string) => {
        if (!apiKey) {
            setError('API Key no encontrada');
            setLoading(false);
            return [];
        }

        try {
            const response = await apiClient.get<Participant[]>(
                `/events/${eventId}/participants?status=${status}`, 
                { 
                    headers: { 
                        'c-api-key': apiKey,
                        'x-auth-type': 'club'
                    } 
                }
            );

            if (response.data && Array.isArray(response.data)) {
                return response.data;
            } else {
                return [];
            }
        } catch (err) {
            console.error(`Error al obtener participantes ${status}:`, err);
            return [];
        }
    };

    const loadAllParticipants = async () => {
        setLoading(true);
        try {
            const [pending, accepted] = await Promise.all([
                fetchParticipants('pending'),
                fetchParticipants('accepted')
            ]);
            
            setPendingParticipants(pending);
            setAcceptedParticipants(accepted);
            setError(null);
        } catch (err) {
            console.error('Error al cargar participantes:', err);
            setError('Error al cargar los participantes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) {
            loadAllParticipants();
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
            
            // Update local state first for immediate UI feedback
            const acceptedParticipant = pendingParticipants.find(p => p.userId === userId);
            if (acceptedParticipant) {
                setPendingParticipants(prev => prev.filter(p => p.userId !== userId));
                setAcceptedParticipants(prev => [...prev, {...acceptedParticipant, participantStatus: true}]);
            }
            
            // Notify parent component
            if (onRequestsChange) onRequestsChange('accept');
            
            // Then refresh from server to ensure data consistency
            loadAllParticipants();
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
            
            // Update local state first for immediate UI feedback
            setPendingParticipants(prev => prev.filter(p => p.userId !== userId));
            
            // Notify parent component that a participant was rejected
            if (onRequestsChange) onRequestsChange('reject');
            
            // Then refresh from server to ensure data consistency
            loadAllParticipants();
        } catch (err) {
            console.error('Error al rechazar participante:', err);
        }
    };

    const handleContact = (participant: Participant) => {
        // Open phone dialer or messaging app
        if (participant.phoneNumber) {
            window.open(`tel:${participant.phoneNumber}`, '_blank');
        }
    };

    if (loading) {
        return <div className="text-center py-4">Cargando participantes...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-4">{error}</div>;
    }

    return (
        <div className={styles.tabsList}>
            <div className="w-full">
                <div className="grid w-full grid-cols-2 mb-4">
                    <button
                        className={`${styles.tabsTrigger} ${pendingParticipants.length > 0 ? styles.tabsTriggerActive : ''}`}
                        onClick={() => document.getElementById('pending-tab')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Solicitudes Pendientes
                    </button>
                    <button
                        className={`${styles.tabsTrigger} ${acceptedParticipants.length > 0 ? styles.tabsTriggerActive : ''}`}
                        onClick={() => document.getElementById('accepted-tab')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Participantes Aceptados
                    </button>
                </div>

                <div id="pending-tab" className={styles.tabsContent}>
                    {pendingParticipants.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">No hay solicitudes pendientes</div>
                    ) : (
                        <div className="space-y-3">
                            {pendingParticipants.map((participant) => (
                                <Card key={participant.userId} className="overflow-hidden">
                                    <div className={styles.participantItem}>
                                        <div className={styles.participantInfo}>
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback>
                                                    {participant.firstname.charAt(0)}{participant.lastname.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <h4 className={styles.participantName}>{participant.firstname} {participant.lastname}</h4>
                                                <div className="flex flex-col text-sm text-gray-500">
                                                    {participant.phoneNumber && (
                                                        <p>{participant.phoneNumber}</p>
                                                    )}
                                                    {participant.rating && (
                                                        <div className="flex items-center mt-1">
                                                            <Star className="h-5 w-5 text-yellow-500 mr-1" />
                                                            <span>{participant.rating.rate.toFixed(1)} ({participant.rating.count})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.participantActions}>
                                            <button
                                                onClick={() => handleAccept(participant.userId)}
                                                className={styles.acceptButton}
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => handleReject(participant.userId)}
                                                className={styles.rejectButton}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div id="accepted-tab" className={styles.tabsContent}>
                    {acceptedParticipants.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">No hay participantes aceptados</div>
                    ) : (
                        <div className="space-y-3">
                            {acceptedParticipants.map((participant) => (
                                <Card key={participant.userId} className="overflow-hidden">
                                    <div className={styles.participantItem}>
                                        <div className={styles.participantInfo}>
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback>
                                                    {participant.firstname.charAt(0)}{participant.lastname.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <h4 className={styles.participantName}>{participant.firstname} {participant.lastname}</h4>
                                                <div className="flex flex-col text-sm text-gray-500">
                                                    {participant.phoneNumber && (
                                                        <p>{participant.phoneNumber}</p>
                                                    )}
                                                    {participant.rating && (
                                                        <div className="flex items-center mt-1">
                                                            <Star className="h-5 w-5 text-yellow-500 mr-1" />
                                                            <span>{participant.rating.rate.toFixed(1)} ({participant.rating.count})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.participantActions}>
                                            <button
                                                onClick={() => handleContact(participant)}
                                                className={styles.acceptButton}
                                                disabled={!participant.phoneNumber}
                                                title={participant.phoneNumber ? "Contactar" : "No hay número de teléfono"}
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};