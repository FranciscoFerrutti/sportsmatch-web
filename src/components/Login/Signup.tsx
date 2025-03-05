import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { SignupData } from '@/types/auth';
import apiClient from '@/apiClients.ts';
import { CheckCircle2 } from 'lucide-react';

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    phoneNumber: '',
    email: '',
    description: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
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

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error('Error inesperado en el registro.');
      }

    } catch (err: any) {
      console.error('❌ Error en el registro:', err);
      setError(err.response?.data?.message || 'Error al registrar el club.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
        <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold text-center text-[#000066]">
              ¡Registro exitoso!
            </h2>
            <p className="text-center text-gray-600">
              Te hemos enviado un email de verificación.
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.
            </p>
            <p className="text-gray-500 text-sm">
              Serás redirigido al inicio de sesión en unos segundos...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
        <Card className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-[#000066] mb-6">Registro de Club</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField label="Nombre del club:" name="name" value={formData.name} onChange={handleInputChange} required />
            <InputField label="Teléfono:" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} required />
            <InputField label="Email:" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            <InputField label="Descripción:" name="description" as="textarea" value={formData.description} onChange={handleInputChange} />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Contraseña:" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
              <InputField label="Confirmar contraseña:" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>

            {error && <div className="text-red-600 text-sm text-center bg-red-100 border border-red-400 rounded-lg p-2">{error}</div>}

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
