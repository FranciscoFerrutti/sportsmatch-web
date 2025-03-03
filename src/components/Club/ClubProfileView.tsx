import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Edit, UserCircle } from 'lucide-react';
import apiClient from '@/apiClients';

export const ClubProfileView = () => {
    const { clubId, logout } = useAuth();
    const navigate = useNavigate();
    const apiKey = localStorage.getItem('c-api-key');

    const [clubData, setClubData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        imageUrl: '',
        description: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);

    useEffect(() => {
        if (!clubId || !apiKey) {
            console.error('⚠️ No hay `clubId` o `apiKey`, redirigiendo a login...');
            logout();
            navigate('/login');
            return;
        }

        const fetchClubData = async () => {
            try {
                const response = await apiClient.get(`/clubs`, {
                    headers: { 'c-api-key': apiKey },
                    params: { clubId }
                });

                setClubData({
                    name: response.data.name || 'Sin nombre',
                    email: response.data.email || 'Sin correo',
                    phone: response.data.phone_number || 'Sin teléfono',
                    address: response.data.address || 'Sin dirección',
                    imageUrl: response.data.image_url || '',
                    description: response.data.description || '',
                });
            } catch (error) {
                console.error('❌ Error al cargar datos del club:', error);
                setError('No se pudo cargar la información del club.');
            }
        };

        fetchClubData();
    }, [clubId, apiKey, logout, navigate]);

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Perfil del Club</h1>
                <Button
                    onClick={() => navigate('/club-profile/edit')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center px-4 py-2 rounded-lg"
                >
                    <Edit className="w-5 h-5 mr-2" /> Editar perfil
                </Button>
            </div>

            <Card className="p-6 shadow-lg bg-white rounded-2xl border border-gray-200">
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4">
                        {!imageError && clubData.imageUrl ? (
                            <img
                                src={clubData.imageUrl}
                                alt="Club"
                                className="w-full h-full rounded-full object-cover border"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <UserCircle className="w-full h-full text-gray-400" />
                        )}
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div>
                        <p className="text-gray-600 text-sm">Nombre del club:</p>
                        <p className="font-medium text-lg">{clubData.name}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Correo electrónico:</p>
                        <p className="font-medium text-lg">{clubData.email}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Teléfono:</p>
                        <p className="font-medium text-lg">{clubData.phone}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Dirección:</p>
                        <p className="font-medium text-lg">{clubData.address}</p>
                    </div>

                    <div className="mt-6">
                        <p className="text-gray-600 text-sm">Descripción:</p>
                        <p className="font-medium">{clubData.description || 'Sin descripción'}</p>
                    </div>
                </div>

                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </Card>
        </div>
    );
};
