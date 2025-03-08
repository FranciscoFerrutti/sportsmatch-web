import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';
import apiClient from '@/apiClients';
import { useAuth } from '@/context/AppContext';
import { NotFound } from '../NotFound';

/// <reference types="@types/google.maps" />

const SHORT_NAME_ADDRESS_COMPONENT_TYPES = new Set([
  'street_number',
  'administrative_area_level_1',
  'postal_code'
]);

export const LocationSelector = () => {
  const navigate = useNavigate();
  const { clubId } = useAuth();
  const apiKey = localStorage.getItem('c-api-key');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullAddressDisplay, setFullAddressDisplay] = useState<string>('');
  const [hasLocation, setHasLocation] = useState<boolean | null>(null);
  const [locationUpdated, setLocationUpdated] = useState(false);

  useEffect(() => {
    const checkClubLocation = async () => {
      try {
        const response = await apiClient.get(`/clubs`, {
          params: { clubId }
        });

        setHasLocation(!!response.data.location);
      } catch (error) {
        console.error('❌ Error al verificar la ubicación del club:', error);
        setError('Error al verificar la ubicación del club');
      } finally {
        setIsLoading(false);
      }
    };

    checkClubLocation();
  }, [clubId]);

  useEffect(() => {
    if (hasLocation === false) {
      const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      const loader = new Loader({
        apiKey: API_KEY,
        version: "weekly",
        libraries: ["places", "maps"]
      });

      loader.load().then(() => {
        initMap();
        initAutocomplete();
      });
    }
  }, [hasLocation]);

  // Handle navigation after location update
  useEffect(() => {
    if (locationUpdated) {
      // Add a small delay to ensure state is properly updated
      const timer = setTimeout(() => {
        window.location.href = '/home';
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [locationUpdated]);

  const initMap = () => {
    const map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      center: { lat: -34.6037, lng: -58.3816 }, // Default to Buenos Aires
      zoom: 12,
    });

    // Create a marker
    const marker = new google.maps.Marker({
      map,
      draggable: false,
    });

    (window as any).locationMap = map;
    (window as any).locationMarker = marker;
  };

  const initAutocomplete = () => {
    const input = document.getElementById('location-input') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['address_components', 'geometry'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      setError(null);
      
      if (!place.geometry?.location) {
        window.alert(`No details available for input: '${place.name}'`);
        return;
      }

      // Check if location is in CABA
      const city = place.address_components?.find(comp => 
        comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
      )?.long_name;

      if (!city || !city.toLowerCase().includes('buenos aires')) {
        setError('El club debe pertenecer a la Ciudad Autónoma de Buenos Aires');
        setFullAddressDisplay('');
        return;
      }

      // Update map and marker
      const map = (window as any).locationMap;
      const marker = (window as any).locationMarker;
      
      map.setCenter(place.geometry.location);
      map.setZoom(17);
      marker.setPosition(place.geometry.location);

      // Store the place for later use
      (window as any).lastSelectedPlace = place;

      setCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });

      // Generate and display full address
      const components = place.address_components || [];
      const getComponent = (type: string) => {
        const component = components.find(comp => comp.types[0] === type);
        return component 
          ? SHORT_NAME_ADDRESS_COMPONENT_TYPES.has(type) 
            ? component.short_name 
            : component.long_name
          : '';
      };

      const streetNumber = getComponent('street_number');
      const route = getComponent('route');
      const neighborhood = getComponent('sublocality_level_1');
      const locality = getComponent('locality');
      const state = getComponent('administrative_area_level_1');
      const postalCode = getComponent('postal_code');
      const country = getComponent('country');

      const address = `${streetNumber} ${route}`.trim();
      const fullAddress = [address, neighborhood, locality, state, postalCode, country]
        .filter(Boolean)
        .join(', ');

      setFullAddressDisplay(fullAddress);
      fillInAddress(place);
    });
  };

  const fillInAddress = (place: google.maps.places.PlaceResult) => {
    const addressComponents = place.address_components || [];
    
    const getComponent = (type: string) => {
      const component = addressComponents.find(comp => comp.types[0] === type);
      return component 
        ? SHORT_NAME_ADDRESS_COMPONENT_TYPES.has(type) 
          ? component.short_name 
          : component.long_name
        : '';
    };

    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    
    (document.getElementById('location-input') as HTMLInputElement).value = 
      `${streetNumber} ${route}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!coordinates) {
      setError('Por favor seleccione una ubicación válida');
      setIsLoading(false);
      return;
    }

    const place = (window as any).lastSelectedPlace as google.maps.places.PlaceResult;
    if (!place?.address_components) {
      setError('Por favor seleccione una ubicación válida del autocompletado');
      setIsLoading(false);
      return;
    }

    const getComponent = (type: string) => {
      const component = place.address_components?.find(comp => comp.types[0] === type);
      return component 
        ? SHORT_NAME_ADDRESS_COMPONENT_TYPES.has(type) 
          ? component.short_name 
          : component.long_name
        : '';
    };

    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const locality = getComponent('sublocality_level_1');

    const address = `${streetNumber} ${route}`.trim();

    try {
      const payload = {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: address,
        locality: locality
      };

      const response = await apiClient.put(`/clubs/${clubId}/location`, payload, {
        headers: { 'c-api-key': apiKey },
      });

      console.log('✅ Ubicación actualizada correctamente:', response.data);
      setLocationUpdated(true);
    } catch (error) {
      console.error('❌ Error al actualizar la ubicación:', error);
      setError('No se pudo actualizar la ubicación. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000066]"></div>
      </div>
    );
  }

  if (hasLocation) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://new-sportsmatch-user-pictures.s3.us-east-1.amazonaws.com/logo_square.png"
            alt="SportsMatch Logo"
            className="w-20 h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-[#000066] mb-2">
            ¡Bienvenido a Sportsmatch!
          </h1>
          <p className="text-gray-600 text-lg">
            Por favor agrega la ubicación de tu club
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <img className="h-6 w-6 mr-2" src="https://fonts.gstatic.com/s/i/googlematerialicons/location_pin/v5/24px.svg" alt="" />
              <h1 className="text-xl font-semibold">Seleccionar Ubicación</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <input
                type="text"
                placeholder="Dirección"
                id="location-input"
                className="w-full p-2 border border-gray-300 rounded"
                autoComplete="off"
                role="presentation"
              />
              {fullAddressDisplay && !error && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Dirección completa:</p>
                  <p className="text-gray-600">{fullAddressDisplay}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-[#000066] hover:bg-[#000088] text-white p-2 rounded"
                disabled={isLoading || !!error}
              >
                {isLoading ? "Guardando..." : "Confirmar dirección"}
              </button>
              {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
            </form>
          </div>

          {/* Map Column */}
          <div className="bg-white rounded-lg shadow">
            <div 
              id="map" 
              className="w-full h-full min-h-[500px] rounded-lg"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};