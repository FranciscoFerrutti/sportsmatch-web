import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Camera, Save, UserCircle, LogOut } from 'lucide-react';
import apiClient from '@/apiClients';
import { useAuth } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export const ProfileView = () => {
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

    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                    imageUrl: response.data.imageUrl || '',
                    description: response.data.description || '',
                });

                if (response.data.imageUrl) {
                    setImagePreview(response.data.imageUrl);
                }
            } catch (error) {
                console.error('❌ Error al cargar datos del club:', error);
                setError('No se pudo cargar la información del club.');
            }
        };

        fetchClubData();
    }, [clubId, apiKey, logout, navigate]);

    // 📌 Nuevo método: Obtener una URL pre-firmada y subir la imagen a S3
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // 1️⃣ Pedir la URL pre-firmada al backend
            const res = await apiClient.put(`/clubs/${clubId}/image`, null, {
                headers: { 'c-api-key': apiKey },
            });

            if (!res.data.presignedPutUrl) {
                throw new Error('No se pudo obtener la URL pre-firmada.');
            }

            const presignedUrl = res.data.presignedPutUrl;

            // 2️⃣ Subir la imagen a S3 usando la URL pre-firmada
            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },  // 🔥 IMPORTANTE: Asegura que tenga `Content-Type`
            });

            if (!uploadResponse.ok) {
                throw new Error("Error al subir la imagen.");
            }

            // 3️⃣ Mostrar la imagen en el frontend
            setImagePreview(URL.createObjectURL(file));
            alert("✅ Imagen subida con éxito.");
        } catch (error) {
            console.error("❌ Error al subir imagen:", error);
            setError("No se pudo subir la imagen.");
        }
    };



    const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setClubData(prev => ({ ...prev, description: event.target.value }));
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError(null);

        try {
            const updatedData = {
                imageUrl: imagePreview || clubData.imageUrl,
                description: clubData.description,
            };

            await apiClient.put(`/clubs/${clubId}`, updatedData, {
                headers: { 'c-api-key': apiKey },
            });

            setLoading(false);
            alert('✅ Cambios guardados con éxito.');
        } catch (error) {
            console.error('❌ Error al guardar cambios:', error);
            setError('No se pudo guardar la información.');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#000066]">Perfil del Club</h1>
            </div>

            <Card className="p-6 shadow-lg bg-white rounded-2xl border border-gray-200">
                {/* 📌 Sección de la imagen */}
                <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Club" className="w-full h-full rounded-full object-cover border" />
                        ) : (
                            <UserCircle className="w-full h-full text-gray-400" />
                        )}
                        <label className="absolute bottom-0 right-0 bg-gray-200 p-2 rounded-full cursor-pointer">
                            <Camera className="w-5 h-5 text-gray-600" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                    <p className="text-sm text-gray-500">Haz clic en el ícono para cambiar la foto</p>
                </div>

                {/* Información del Club */}
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
                </div>

                {/* Sección de descripción */}
                <div className="mt-6">
                    <label className="block text-gray-700 font-medium mb-2">Descripción del club:</label>
                    <textarea
                        value={clubData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Añade una descripción sobre tu club..."
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-300"
                        rows={4}
                    />
                </div>

                {/* Mensaje de error */}
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

                {/* Botón de Guardar */}
                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={handleSaveChanges}
                        className="bg-[#000066] hover:bg-[#000088] text-white flex items-center px-4 py-2 rounded-lg"
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : <><Save className="w-5 h-5 mr-2" /> Guardar cambios</>}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
