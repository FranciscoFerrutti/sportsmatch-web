// src/components/Courts/CourtsView.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourts } from '@/context/CourtsContext';
import type { Court } from '@/context/CourtsContext'; // Add this import

interface DeleteConfirmationProps {
  isOpen: boolean;
  courtName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  courtName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
        <p className="mb-6">¿Estás seguro que deseas eliminar {courtName}?</p>
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface CourtsViewProps {
  onNewCourt: () => void;
  onModifyCourt: (courtId: number) => void;
}

export const CourtsView: React.FC<CourtsViewProps> = ({ onNewCourt, onModifyCourt }) => {
  const { courts, deleteCourt } = useCourts();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    courtId: number | null;
    courtName: string;
  }>({
    isOpen: false,
    courtId: null,
    courtName: '',
  });

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleDeleteClick = (court: Court) => {
    setDeleteConfirmation({
      isOpen: true,
      courtId: court.id,
      courtName: court.name,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.courtId !== null) {
      deleteCourt(deleteConfirmation.courtId);
    }
    setDeleteConfirmation({
      isOpen: false,
      courtId: null,
      courtName: '',
    });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      isOpen: false,
      courtId: null,
      courtName: '',
    });
  };

  return (
    <div className="p-6">
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        courtName={deleteConfirmation.courtName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Mis canchas</h1>
        <Button 
          className="bg-[#000066] hover:bg-[#000088]"
          onClick={onNewCourt}
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
                onClick={() => onModifyCourt(court.id)}
              >
                Modificar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => handleDeleteClick(court)}
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