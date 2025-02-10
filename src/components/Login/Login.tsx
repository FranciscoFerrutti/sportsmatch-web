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
      console.log("Enviando solicitud de login con:", formData);

      setBasicAuthHeader(formData.email, formData.password);
      const response = await apiClient.get('/clubauth');

      console.log("Respuesta recibida:", response);

      const apiKey = response.headers['c-api-key'];

      let clubId: number | null = null;
      if (apiKey) {
        const payloadBase64 = apiKey.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        clubId = parseInt(decodedPayload.id) + 1;
      }

      console.log("API Key:", apiKey);
      console.log("Club ID (extraído del token):", clubId);

      if (apiKey && clubId) {
        localStorage.setItem('c-api-key', apiKey);
        localStorage.setItem('clubId', clubId.toString());
        login(apiKey, clubId);
        console.log('Inicio de sesión exitoso');
        navigate('/home');
      } else {
        setError('Error al obtener credenciales.');
      }
    } catch (err: any) {
      console.error("Error en la solicitud de login:", err);

      if (err.response) {
        console.error("Detalles del error:", err.response);
        setError(err.response.data?.message || 'Error al conectar con el servidor.');
      } else if (err.request) {
        console.error("El servidor no respondió.");
        setError('No se recibió respuesta del servidor.');
      } else {
        console.error("Error en la configuración de la solicitud:", err.message);
        setError('Error desconocido.');
      }
    }
  };



  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-white">
          <h1 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Email:</label>
              <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                  required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Contraseña:</label>
              <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                  required
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button type="submit" className="w-full bg-[#000066] hover:bg-[#000088]">
              Ingresar
            </Button>

            <p className="text-center text-gray-600 mt-4">
              ¿No tienes una cuenta?{' '}
              <Link to="/signup" className="text-[#000066] hover:text-[#000088] font-medium">
                Registrarse
              </Link>
            </p>
          </form>
        </Card>
      </div>
  );
};
