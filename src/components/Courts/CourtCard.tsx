import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Court } from '@/types';

type CourtCardProps = {
  court: Court;
  onModify: (id: number) => void;
};

export const CourtCard = ({ court, onModify }: CourtCardProps) => (
  <Card className="p-4">
    <CardContent>
      <h3 className="font-bold mb-2">{court.name}</h3>
      <p className="text-gray-600">{court.sport}</p>
      <div className="mt-4 space-y-1 text-sm">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
          <p key={day} className="text-gray-500">
            {day}: 08:00 - 21:00
          </p>
        ))}
      </div>
      <Button 
        variant="outline" 
        className="mt-4 w-full"
        onClick={() => onModify(court.id)}
      >
        Modificar
      </Button>
    </CardContent>
  </Card>
);