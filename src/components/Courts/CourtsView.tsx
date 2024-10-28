// src/components/Courts/CourtsView.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourts } from '@/context/CourtsContext';
import type { Court } from '@/context/CourtsContext';

export const CourtsView = () => {
  const navigate = useNavigate();
  const { courts, deleteCourt } = useCourts(); // Add deleteCourt to the destructuring

  const handleNewCourt = () => {
    navigate('/courts/new');
  };

  const handleModifyCourt = (courtId: number) => {
    navigate(`/courts/${courtId}/edit`);
  };

  const handleDeleteCourt = (courtId: number) => {
    if (window.confirm('¿Está seguro que desea eliminar esta cancha?')) {
      deleteCourt(courtId);
    }
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Mis canchas</h1>
        <Button 
          className="bg-[#000066] hover:bg-[#000088]"
          onClick={handleNewCourt}
        >
          Nueva cancha
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courts.map(court => (
          <Card key={court.id} className="p-4 bg-white">
            <h3 className="font-semibold text-lg mb-2">{court.name}</h3>
            <p className="text-gray-600 mb-4">{court.sport}</p>
            <p className="text-gray-600 mb-4">Precio: ${court.price}</p>
            <p className="text-gray-600 mb-4">{capitalize(court.covered)}</p>
            <p className="text-gray-600 mb-4">Material: {court.material}</p>
            
            <div className="space-y-1 text-sm mb-4">
              {Object.entries(court.schedule).map(([day, { start, end, closed }]) => (
                <p key={day} className="text-gray-500">
                  {day}: {closed ? 'Cerrado' : `${start} - ${end}`}
                </p>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleModifyCourt(court.id)}
              >
                Modificar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => handleDeleteCourt(court.id)}
              >
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};