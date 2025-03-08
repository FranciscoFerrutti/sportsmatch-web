import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import apiClient from '@/apiClients';

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, clubId } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState<boolean | null>(null);

  useEffect(() => {
    const checkClubLocation = async () => {
      if (!clubId) {
        setHasLocation(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/clubs`, {
          params: { clubId }
        });

        setHasLocation(!!response.data.location);
      } catch (error) {
        console.error('❌ Error al verificar la ubicación del club:', error);
        setHasLocation(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      checkClubLocation();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, clubId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000066]"></div>
      </div>
    );
  }

  // Special case for club-location route
  if (location.pathname === '/club-location') {
    // If they already have a location, they shouldn't access this page
    // The LocationSelector component will handle showing the 404
    return children;
  }

  // For all other routes, redirect to location selector if no location
  if (!hasLocation) {
    return <Navigate to="/club-location" />;
  }

  return children;
};
