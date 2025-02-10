import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import type { SignupData } from '@/types/auth';
import apiClient from '@/apiClients.ts';

export const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await apiClient.post('/clubauth', {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        console.log('Registro exitoso');

        const { apiKey, clubId } = response.data;

        if (apiKey && clubId) {
          localStorage.setItem('c-api-key', apiKey);
          localStorage.setItem('clubId', clubId.toString());
          login(apiKey, clubId);
          navigate('/home');
        } else {
          navigate('/login');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el club.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <Card className="max-w-2xl mx-auto p-6 bg-white">
          <h1 className="text-2xl font-bold text-center mb-6">Registro de Club</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Nombre del club:</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} className="w-full" required />
            </div>

            <div>
              <label className="block mb-2 font-medium">Teléfono:</label>
              <Input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} className="w-full" required />
            </div>

            <div>
              <label className="block mb-2 font-medium">Email:</label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Contraseña:</label>
                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full" required />
              </div>

              <div>
                <label className="block mb-2 font-medium">Confirmar contraseña:</label>
                <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} className="w-full" required />
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button type="submit" className="w-full bg-[#000066] hover:bg-[#000088]">
              Registrarse
            </Button>

            <p className="text-center text-gray-600 mt-4">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-[#000066] hover:text-[#000088] font-medium">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </Card>
      </div>
  );
};
