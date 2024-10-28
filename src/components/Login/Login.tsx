import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AppContext';

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

    if (formData.email && formData.password) {
      login();
      navigate('/home');
    } else {
      setError('Por favor, ingresa un email y contraseña válidos.');
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
