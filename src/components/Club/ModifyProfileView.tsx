import React, {useState, useEffect} from 'react';
import {Card} from '@/components/ui/card';
import {Camera, Save, UserCircle, X, Edit} from 'lucide-react';
import apiClient from '@/apiClients';
import {useAuth} from '@/context/AppContext';
import {useNavigate} from 'react-router-dom';
import styles from './Profile.module.css';
import {Button} from "../ui/button.tsx";

export const ModifyProfileView = () => {
    const {clubId, logout} = useAuth();
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

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDescriptionDisabled, setIsDescriptionDisabled] = useState(false);

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
                    headers: {'c-api-key': apiKey},
                    params: {clubId}
                });

                setClubData({
                    name: response.data.name || 'Sin nombre',
                    email: response.data.email || 'Sin correo',
                    phone: response.data.phone_number || 'Sin teléfono',
                    address: response.data.address + ', ' + response.data.location || 'Sin dirección',
                    imageUrl: response.data.imageUrl || '',
                    description: response.data.description || '',
                });

                setIsDescriptionDisabled(!response.data.description || response.data.description === 'Sin descripción');

                if (response.data.image_url) {
                    setImagePreview(response.data.image_url);
                }
            } catch (error) {
                console.error('❌ Error al cargar datos del club:', error);
                setError('No se pudo cargar la información del club.');
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchClubData();
    }, [clubId, apiKey, logout, navigate]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsSaving(true);

        try {
            const uploadResult = await apiClient.put(`/clubs/${clubId}/image`, null, {
                headers: {
                    'c-api-key': apiKey,
                    'Content-Type': file.type
                },
            });

            if (!uploadResult.data.presignedPutUrl) {
                throw new Error("No se pudo obtener la URL pre-firmada.");
            }

            const presignedUrl = uploadResult.data.presignedPutUrl;
            const imageUrl = uploadResult.data.imageUrl;

            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Error al subir la imagen: ${uploadResponse.status} - ${uploadResponse.statusText}`);
            }

            setImagePreview(imageUrl);
            setClubData(prev => ({...prev, imageUrl}));

        } catch (error) {
            console.error("❌ Error al subir imagen:", error);
            setError("No se pudo subir la imagen.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDescriptionField = () => {
        const newDescriptionDisabledState = !isDescriptionDisabled;
        setIsDescriptionDisabled(newDescriptionDisabledState);
        // Set to "Sin descripción" when disabling
        if (newDescriptionDisabledState) {
            setClubData(prev => ({
                ...prev,
                description: 'Sin descripción'
            }));
        }
        // Clear description when enabling
        else {
            setClubData(prev => ({
                ...prev,
                description: ''
            }));
        }
    };

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setClubData(prev => ({...prev, description: event.target.value}));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const updatedData: Record<string, any> = {};

            if (isDescriptionDisabled) {
                updatedData.description = 'Sin descripción';
            }
            // If description is not disabled and has content, add it
            else if (clubData.description?.trim()) {
                updatedData.description = clubData.description.trim();
            }

            await apiClient.put(`/clubs/${clubId}`, updatedData, {
                headers: {
                    'c-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
            });

            navigate('/club-profile');
        } catch (error) {
            console.error('❌ Error al guardar cambios:', error);
            setError('No se pudo guardar la información.');
            setIsSaving(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (isInitialLoading) {
        return (
            <div className={styles.loadingSpinner}>
                <p className={styles.loadingText}>Cargando datos</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Editar Perfil del Club</h1>
            </div>

            {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-100 border border-red-400 rounded-lg">
                    {error}
                </div>
            )}

            <Card className="p-6 shadow-lg bg-white rounded-2xl border border-gray-200">
                {/* 📌 Sección de la imagen */}
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Club"
                                className="w-full h-full rounded-full object-cover border"
                                onError={() => setImagePreview(null)}
                            />
                        ) : (
                            <UserCircle className="w-full h-full text-gray-400"/>
                        )}
                        <label className="absolute bottom-0 right-0 bg-gray-200 p-2 rounded-full cursor-pointer">
                            <Camera className="w-5 h-5 text-gray-600"/>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    <p className="text-sm text-gray-500">Haz clic en el ícono para cambiar la foto</p>
                </div>

                {/* 📌 Información del Club */}
                <div className="mt-6 space-y-4">
                    <div>
                        <p className="text-gray-600 text-sm">Nombre del club:</p>
                        <p className="font-medium text-lg text-[#000066]">{clubData.name}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Correo electrónico:</p>
                        <p className="font-medium text-lg text-[#000066]">{clubData.email}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Teléfono:</p>
                        <p className="font-medium text-lg text-[#000066]">{clubData.phone}</p>
                    </div>

                    <div>
                        <p className="text-gray-600 text-sm">Dirección:</p>
                        <p className="font-medium text-lg text-[#000066]">{clubData.address}</p>
                    </div>

                    {/* 📌 Descripción editable */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-gray-600 text-sm">Descripción del club:</p>
                            <button
                                onClick={toggleDescriptionField}
                                className="text-sm text-[#000066] hover:bg-gray-100 p-1 rounded flex items-center"
                                disabled={isSaving}
                            >
                                {isDescriptionDisabled ?
                                    <><Edit className="w-4 h-4 mr-1"/> Activar descripción</> :
                                    <><X className="w-4 h-4 mr-1"/> Desactivar descripción</>
                                }
                            </button>
                        </div>
                        <textarea
                            value={clubData.description}
                            onChange={handleDescriptionChange}
                            placeholder="Añade una descripción..."
                            className={`w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-300 ${isDescriptionDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                            rows={4}
                            disabled={isDescriptionDisabled}
                        />
                        {isDescriptionDisabled && (
                            <p className="text-sm text-gray-500 mt-1">
                                Descripción desactivada. Haga clic en "Activar descripción" para editarla.
                            </p>
                        )}
                    </div>
                </div>

                {/* 📌 Botón de Guardar */}
                <div className={styles.formActions}>
                    <Button
                        type="button"
                        className="bg-[#000066] hover:bg-[#000088] text-white px-6 py-2 rounded-lg shadow-md"
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                    >
                        {isSaving ? "Guardando..." : <><Save className="w-5 h-5 mr-2" /> Guardar cambios</>}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
