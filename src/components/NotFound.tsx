import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { useAuth } from '@/context/AppContext';

export const NotFound = () => {
  const { isAuthenticated } = useAuth();

  const handleNavigation = () => {
    if (isAuthenticated) {
      window.location.href = '/home';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-6">
      <Card className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://new-sportsmatch-user-pictures-2025.s3.us-east-1.amazonaws.com/logo.png"
              alt="SportsMatch Logo"
              className="w-24 h-24 object-contain"
            />
          </div>

          <XCircle className="w-12 h-12 text-red-500" />

          <h2 className="text-2xl font-bold text-center text-[#000066]">
            Página no encontrada
          </h2>

          <p className="text-gray-600 text-center">
            La página que estás buscando no existe o no tienes acceso a ella.
          </p>

          <Button
            onClick={handleNavigation}
            className="bg-[#000066] hover:bg-[#000088] text-white"
          >
            {isAuthenticated ? 'Volver al inicio' : 'Ir al inicio de sesión'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
