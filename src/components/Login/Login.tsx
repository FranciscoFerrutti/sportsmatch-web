import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import apiClient, { setBasicAuthHeader } from '@/apiClients';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('El email y la contraseña son obligatorios.');
      return;
    }

    try {
      setBasicAuthHeader(formData.email, formData.password);
      const response = await apiClient.get('/clubauth');

      const apiKey = response.headers['c-api-key'];

      let clubId: number | null = null;
      if (apiKey) {
        const payloadBase64 = apiKey.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        clubId = parseInt(decodedPayload.id);
      }

      if (apiKey && clubId) {
        localStorage.setItem('c-api-key', apiKey);
        localStorage.setItem('clubId', clubId.toString());
        login(apiKey, clubId);
        console.log('✅ Inicio de sesión exitoso');
        navigate('/home');
      } else {
        setError('Error al obtener credenciales.');
      }
    } catch (err: any) {
      console.error("❌ Error en la solicitud de login:", err);

      if (err.response) {
        console.error("Detalles del error:", err.response);

        const errorMessage = err.response.data?.message || '';

        if (err.response.status === 404) {
          setError('El email no se encuentra registrado.');
        } else if (err.response.status === 401) {
          setError('Contraseña incorrecta.');
        } else {
          setError(errorMessage || 'Error al conectar con el servidor.');
        }

      } else if (err.request) {
        console.error("⚠️ El servidor no respondió.");
        setError('No se recibió respuesta del servidor.');
      } else {
        console.error("⚠️ Error en la configuración de la solicitud:", err.message);
        setError('Error desconocido.');
      }
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
        <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
                src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo_square.png"
                alt="SportsMatch Logo"
                className="w-24 h-24 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-center text-[#000066] mb-6">
            Iniciar sesión
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email:</label>
              <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#000066]"
                  required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Contraseña:</label>
              <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#000066]"
                  required
              />
            </div>

            {error && (
                <div className="text-red-600 text-sm text-center bg-red-100 border border-red-400 rounded-lg p-2">
                  {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-[#000066] hover:bg-[#000088] text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300"
            >
              Ingresar
            </Button>

            <p className="text-center text-gray-600 mt-4">
              ¿No tienes una cuenta?{' '}
              <Link to="/signup" className="text-[#000066] hover:text-[#000088] font-medium transition-all">
                Registrarse
              </Link>
            </p>
          </form>
        </Card>
      </div>
  );
};