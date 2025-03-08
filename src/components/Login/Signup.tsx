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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "description" && !value.trim()) {  // ⬅️ Excluir 'description'
        newErrors[key] = "Este campo es obligatorio";
      }
    });

    if (!validateEmail(formData.email)) {
      newErrors.email = "El email no tiene un formato válido";
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "El teléfono debe tener exactamente 10 dígitos";
    }

    if (!validatePassword(formData.password)) {
      newErrors.password =
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

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
        }, 30000);
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
              Te enviamos un email de verificación.
              Por favor, revisá tu bandeja de entrada y seguí las instrucciones para verificar tu cuenta.
            </p>
            <p className="text-gray-500 text-sm">
              Serás redirigido al inicio de sesión en un momento...
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
            <InputField label="Nombre del club:" name="name" value={formData.name} onChange={handleInputChange} error={errors.name}/>
            <InputField label="Teléfono:" name="phoneNumber" type="number" value={formData.phoneNumber} onChange={handleInputChange} error={errors.phoneNumber} />
            <InputField label="Email:" name="email" type="text" value={formData.email} onChange={handleInputChange} error={errors.email} />
            <InputField label="Descripción:" name="description" as="textarea" value={formData.description} onChange={handleInputChange} />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Contraseña:" name="password" type="password" value={formData.password} onChange={handleInputChange} error={errors.password}/>
              <InputField label="Confirmar contraseña:" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange}/>
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


const InputField = ({ label, name, type = "text", value, onChange, required = false, as = "input", error }: any) => {
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
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
  );
};
