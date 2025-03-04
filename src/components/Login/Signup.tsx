import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import type { SignupData } from '@/types/auth';
import apiClient, { setBasicAuthHeader } from '@/apiClients.ts';
import { Camera } from 'lucide-react';

export const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    phoneNumber: '',
    email: '',
    description: '',
    password: '',
    confirmPassword: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImageUploadError(null);
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/clubauth', {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        description: formData.description || undefined,
      });

      if (response.status !== 201) throw new Error('Error inesperado en el registro.');

      console.log('✅ Registro exitoso');

      setBasicAuthHeader(formData.email, formData.password);
      const authResponse = await apiClient.get('/clubauth');

      const apiKey = authResponse.headers['c-api-key'];
      let clubId: number | null = null;

      if (apiKey) {
        const payloadBase64 = apiKey.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        clubId = parseInt(decodedPayload.id);
      }

      if (!apiKey || !clubId) throw new Error('Error al obtener credenciales.');

      localStorage.setItem('c-api-key', apiKey);
      localStorage.setItem('clubId', clubId.toString());
      login(apiKey, clubId);

      let imageUrl: string | null = null;
      if (imageFile) {
        try {
          const uploadResult = await apiClient.put(`/clubs/${clubId}/image`, null, {
            headers: { 'c-api-key': apiKey, 'Content-Type': imageFile.type },
          });

          if (uploadResult.data.presignedPutUrl) {
            const presignedUrl = uploadResult.data.presignedPutUrl;
            imageUrl = uploadResult.data.imageUrl;

            const uploadResponse = await fetch(presignedUrl, {
              method: "PUT",
              body: imageFile,
            });

            if (!uploadResponse.ok) throw new Error(`Error HTTP: ${uploadResponse.status}`);
          }
        } catch (uploadError) {
          console.error("❌ Error al subir la imagen:", uploadError);
          setImageUploadError("No se pudo subir la imagen, pero tu cuenta ha sido creada.");
          imageUrl = null; // Continuar sin imagen
        }
      }

      if (imageUrl) {
        await apiClient.put(`/clubs/${clubId}`, { imageUrl }, {
          headers: { 'c-api-key': apiKey, 'Content-Type': 'application/json' },
        });

        console.log(`✅ Imagen subida y guardada: ${imageUrl}`);
      }

      navigate('/club-location');

    } catch (err: any) {
      console.error('❌ Error en el registro:', err);
      setError(err.response?.data?.message || 'Error al registrar el club.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
        <Card className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg border border-gray-200">

          <h1 className="text-3xl font-bold text-center text-[#000066] mb-6">Registro de Club</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Imagen de perfil */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                {imagePreview ? (
                    <img src={imagePreview} alt="Club" className="w-full h-full rounded-full object-cover border" />
                ) : (
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                <label className="absolute bottom-0 right-0 bg-gray-200 p-2 rounded-full cursor-pointer">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {imageUploadError && <p className="text-red-600 text-sm">{imageUploadError}</p>}
            </div>

            <InputField label="Nombre del club:" name="name" value={formData.name} onChange={handleInputChange} required />
            <InputField label="Teléfono:" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} required />
            <InputField label="Email:" name="email" type="email" value={formData.email} onChange={handleInputChange} required />

            <InputField label="Descripción:" name="description" as="textarea" value={formData.description} onChange={handleInputChange} />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Contraseña:" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
              <InputField label="Confirmar contraseña:" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button type="submit" className="w-full bg-[#000066] hover:bg-[#000088] text-white font-semibold py-3 rounded-lg shadow-md">
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>

            <p className="text-center text-gray-600 mt-4">
              ¿Ya tienes una cuenta? <Link to="/login" className="text-[#000066] hover:text-[#000088] font-medium">Iniciar sesión</Link>
            </p>
          </form>
        </Card>
      </div>
  );
};


const InputField = ({ label, name, type = "text", value, onChange, required = false, as = "input" }: any) => {
  return (
      <div>
        <label className="block font-medium text-gray-700 mb-1">{label}</label>
        {as === "textarea" ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-300"
                rows={3}
            />
        ) : (
            <Input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-300"
            />
        )}
      </div>
  );
};
