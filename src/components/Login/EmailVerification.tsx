import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '@/services/authService';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
      <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo_square.png"
              alt="SportsMatch Logo"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Status Icon */}
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 text-red-500" />
          )}

          {/* Message */}
          <h2 className="text-2xl font-bold text-center text-[#000066]">
            {message}
          </h2>

          {/* Redirect Message */}
          <p className="text-gray-600 text-center">
            {redirectCountdown > 0 
              ? `Serás redirigido al inicio de sesión en ${redirectCountdown} segundos...`
              : 'Redirigiendo al inicio de sesión...'}
          </p>

          {/* Manual Navigation Link */}
          {status === 'error' && (
            <Link 
              to="/login" 
              className="text-[#000066] hover:text-[#000088] font-medium transition-all mt-4"
            >
              Ir al inicio de sesión
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}; 