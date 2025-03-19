import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SignupData } from '@/types/auth';
import apiClient from '@/apiClients.ts';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import styles from './Signup.module.css';

const baseS3Url = 'https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/backgrounds';

const fieldBg = `${baseS3Url}/field.jpg`;

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      if (key !== "description" && !value.trim()) {
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
      if (err.response) {
        const { status, data } = err.response;

        if (status === 409) {
          if (data.message.includes("email")) {
            setErrors(prev => ({ ...prev, email: "Este email ya está registrado." }));
          }
          if (data.message.includes("phone")) {
            setErrors(prev => ({ ...prev, phoneNumber: "Este número de teléfono ya está registrado." }));
          }
        } else if (status === 400) {
          setError("Hubo un problema con los datos ingresados. Verifica los campos.");
        } else {
          setError("Error al registrar el club. Intenta nuevamente.");
        }
      } else {
        setError("No se pudo conectar con el servidor. Intenta más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (success) {
    return (
        <div className={styles.signupContainer}>
          <div
              className={styles.signupBackground}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${fieldBg})`,
              }}
          />

          <div className={styles.signupCard}>
            <div className={styles.logoContainer}>
              <img
                  src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo.png"
                  alt="SportsMatch Logo"
                  className={styles.logoImage}
              />
            </div>

            <div className={styles.successContainer}>
              <CheckCircle2 className={styles.successIcon} />
              <h2 className={styles.successHeading}>
                ¡Registro exitoso!
              </h2>
              <p className={styles.successText}>
                Te enviamos un email de verificación.
                Por favor, revisá tu bandeja de entrada y seguí las instrucciones para verificar tu cuenta.
              </p>
              <p className={styles.redirectText}>
                Serás redirigido al inicio de sesión en un momento...
              </p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className={styles.signupContainer}>
        <div
            className={styles.signupBackground}
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${fieldBg})`,
            }}
        />

        <div className={styles.signupCard}>
          <div className={styles.logoContainer}>
            <img
                src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo.png"
                alt="SportsMatch Logo"
                className={styles.logoImage}
            />
          </div>

          <h1 className={styles.signupHeading}>Registro de Club</h1>

          <p className={styles.signupSubtitle}>
            Registra tu club para que los usuarios de nuestra app puedan alquilar tus instalaciones.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Nombre del club:</label>
              <Input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
              />
              {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Teléfono:</label>
              <Input
                  name="phoneNumber"
                  type="number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
              />
              {errors.phoneNumber && <p className={styles.errorText}>{errors.phoneNumber}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Email:</label>
              <Input
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.inputField}
                  required
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Descripción:</label>
              <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Contraseña:</label>
              <div className={styles.passwordInputWrapper}>
                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required={true}
                    className={styles.inputField}
                />
                <div
                    className={styles.passwordToggleIcon}
                    onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.inputLabel}>Confirmar contraseña:</label>
              <div className={styles.passwordInputWrapper}>
                <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={true}
                    className={styles.inputField}
                />
                <div
                    className={styles.passwordToggleIcon}
                    onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
              {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <Button type="submit" className={styles.submitButton}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>

            <p className={styles.linkText}>
              ¿Ya tienes una cuenta? <Link to="/login" className={styles.loginLink}>Iniciar sesión</Link>
            </p>
          </form>
        </div>
      </div>
  );
};
