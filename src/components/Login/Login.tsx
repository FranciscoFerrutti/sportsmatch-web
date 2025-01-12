import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';
import apiClient, {setBasicAuthHeader} from "@/apiClients";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        setError('El email y la contraseña son obligatorios.');
        return;
      }

      setBasicAuthHeader(formData.email, formData.password);

      const response = await apiClient.get('/clubauth');

      if (response.status === 200) {
        const apiKey = response.headers['c-api-key'];
        console.log('Headers completos:', response.headers)
        console.log('Api key: ' + apiKey);
        if (apiKey) {
          localStorage.setItem('c-api-key', apiKey);
          login(apiKey);
          console.log('Inicio de sesión exitoso');
          navigate('/home');
        } else {
          setError('Error al obtener el API key.');
        }
      } else {
        setError('Credenciales incorrectas.');
      }
    } catch (err: any) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al conectar con el servidor.');
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

            {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full bg-[#000066] hover:bg-[#000088]"
            >
              Ingresar
            </Button>

            <p className="text-center text-gray-600 mt-4">
              ¿No tienes una cuenta?{' '}
              <Link
                  to="/signup"
                  className="text-[#000066] hover:text-[#000088] font-medium"
              >
                Registrarse
              </Link>
            </p>
          </form>
        </Card>
      </div>
  );
};
