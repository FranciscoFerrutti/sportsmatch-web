import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '@/services/authService';
import styles from './Signup.module.css';

const baseS3Url = 'https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/backgrounds';

const fieldBg = `${baseS3Url}/field.jpg`;

export const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verificando tu email...');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(0);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no encontrado.');
        setRedirectCountdown(5);
        return;
      }

      const result = await verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setRedirectCountdown(3);
      } else {
        setStatus('error');
        setMessage(result.message);
        setRedirectCountdown(5);
      }
    };

    handleVerification();
  }, [searchParams]);

  // Handle countdown
  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            setShouldNavigate(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [redirectCountdown]);

  // Handle navigation separately
  useEffect(() => {
    if (shouldNavigate) {
      navigate('/login');
    }
  }, [shouldNavigate, navigate]);

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
            {status === 'loading' && (
                <Loader2 className={`${styles.successIcon} text-blue-500 animate-spin`} />
            )}
            {status === 'success' && (
                <CheckCircle2 className={`${styles.successIcon} text-green-500`} />
            )}
            {status === 'error' && (
                <XCircle className={`${styles.successIcon} text-red-500`} />
            )}

            <h2 className={styles.successHeading}>
              {message}
            </h2>

            <p className={styles.successText}>
              {redirectCountdown > 0
                  ? `Serás redirigido al inicio de sesión en ${redirectCountdown} segundos...`
                  : 'Redirigiendo al inicio de sesión...'}
            </p>

            {status === 'error' && (
                <Link
                    to="/login"
                    className={styles.loginLink}
                >
                  Ir al inicio de sesión
                </Link>
            )}
          </div>
        </div>
      </div>
  );
}; 