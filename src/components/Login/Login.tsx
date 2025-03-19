import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import apiClient, { setBasicAuthHeader } from '@/apiClients';
import styles from './Login.module.css';

const baseS3Url = 'https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/backgrounds';

const fieldBg = `${baseS3Url}/field.jpg`;

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError('El email y la contraseña son obligatorios.');
      return;
    }

    setIsLoading(true);
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

        try {
          const clubResponse = await apiClient.get(`/clubs`, {
            params: { clubId }
          });

          if (clubResponse.data.location) {
            navigate('/home');
          } else {
            navigate('/club-location');
          }
        } catch (error) {
          console.error('❌ Error al verificar la ubicación del club:', error);
          navigate('/club-location');
        }
      } else {
        setError('Error al obtener credenciales.');
      }
    } catch (err: any) {
      console.error("❌ Error en la solicitud de login:", err);

      if (err.response) {
        console.error("Detalles del error:", err.response);

        const errorMessage = err.response.data?.message || '';
        const internalStatus = err.response.data?.internalStatus;
        const status = err.response.status;

        if (status === 401 || status === 404) {
            setError('Email o contraseña incorrectos.');
        } else if (status === 403 && internalStatus === 'EMAIL_NOT_VERIFIED') {
          setError('Por favor, verifica tu dirección de email antes de iniciar sesión.');
        } else if (status === 403) {
          setError('Acceso denegado. Verifica tus credenciales.');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className={styles.loginContainer}>
        <div
            className={styles.loginBackground}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${fieldBg})`,
            }}
        />

        <div className={styles.loginCard}>
          <div className={styles.logoContainer}>
            <img
                src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo.png"
                alt="SportsMatch Logo"
                className={styles.logoImage}
            />
          </div>

          <h1 className={styles.loginHeading}>
            Iniciar sesión
          </h1>

          <p className={styles.loginSubtitle}>
            Ingresá a tu cuenta de club para comenzar a administrar tus canchas.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Email:</label>
              <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.inputField}
                  required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Contraseña:</label>
              <div className={styles.passwordInputWrapper}>
                <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={styles.inputField}
                    required
                />
                <div
                    className={styles.passwordToggleIcon}
                    onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
            )}

            <Button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>

            <p className={styles.linkText}>
              ¿No tienes una cuenta?{' '}
              <Link to="/signup" className={styles.signupLink}>
                Registrarse
              </Link>
            </p>
          </form>
        </div>
      </div>
  );
};