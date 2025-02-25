import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';

/// <reference types="@types/google.maps" />

const SHORT_NAME_ADDRESS_COMPONENT_TYPES = new Set([
  'street_number',
  'administrative_area_level_1',
  'postal_code'
]);

export const LocationSelector = () => {
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY';
    
    const loader = new Loader({
      apiKey: API_KEY,
      version: "weekly",
      libraries: ["places", "maps"]
    });

    loader.load().then(() => {
      initMap();
      initAutocomplete();
    });
  }, []);

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
      
      if (!place.geometry?.location) {
        window.alert(`No details available for input: '${place.name}'`);
        return;
      }

      // Update map and marker
      const map = (window as any).locationMap;
      const marker = (window as any).locationMarker;
      
      map.setCenter(place.geometry.location);
      map.setZoom(17);
      marker.setPosition(place.geometry.location);

      setCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });

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

    (document.getElementById('locality-input') as HTMLInputElement).value = 
      getComponent('locality');
    (document.getElementById('administrative_area_level_1-input') as HTMLInputElement).value = 
      getComponent('administrative_area_level_1');
    (document.getElementById('postal_code-input') as HTMLInputElement).value = 
      getComponent('postal_code');
    (document.getElementById('country-input') as HTMLInputElement).value = 
      getComponent('country');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      address: (document.getElementById('location-input') as HTMLInputElement)?.value,
      city: (document.getElementById('locality-input') as HTMLInputElement)?.value,
      state: (document.getElementById('administrative_area_level_1-input') as HTMLInputElement)?.value,
      postalCode: (document.getElementById('postal_code-input') as HTMLInputElement)?.value,
      country: (document.getElementById('country-input') as HTMLInputElement)?.value,
      coordinates: coordinates
    };
    console.log('Location Data:', formData);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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
                style={{ display: 'none' }}
                name="hidden"
                id="hidden"
              />
              <input
                type="text"
                style={{ display: 'none' }}
                name="fake-username"
                id="fake-username"
              />
              <input
                type="password"
                style={{ display: 'none' }}
                name="fake-password"
                id="fake-password"
              />
              
              <input
                type="text"
                placeholder="Dirección"
                id="location-input"
                className="w-full p-2 border border-gray-300 rounded"
                autoComplete="off"
                role="presentation"
              />
              <input
                type="text"
                placeholder="Ciudad"
                id="locality-input"
                className="w-full p-2 border border-gray-300 rounded"
                autoComplete="chrome-off"
                data-lpignore="true"
                data-form-type="other"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Provincia"
                  id="administrative_area_level_1-input"
                  className="w-full p-2 border border-gray-300 rounded col-span-2"
                  autoComplete="chrome-off"
                  data-lpignore="true"
                  data-form-type="other"
                />
                <input
                  type="text"
                  placeholder="CP"
                  id="postal_code-input"
                  className="w-full p-2 border border-gray-300 rounded"
                  autoComplete="chrome-off"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              <input
                type="text"
                placeholder="País"
                id="country-input"
                className="w-full p-2 border border-gray-300 rounded"
                autoComplete="chrome-off"
                data-lpignore="true"
                data-form-type="other"
              />
              <button
                type="submit"
                className="w-full bg-[#000066] hover:bg-[#000088] text-white p-2 rounded"
              >
                Confirmar dirección
              </button>
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