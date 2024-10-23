// src/components/Courts/CourtsView.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Court = {
  id: number;
  name: string;
  sport: string;
  schedule: Array<{
    day: string;
    hours: string;
  }>;
};

export interface CourtsViewProps {
  onNewCourt: () => void;
}

export const CourtsView: React.FC<CourtsViewProps> = ({ onNewCourt }) => {
  const courts: Court[] = [
    {
      id: 1,
      name: 'Cancha 1',
      sport: 'Tenis',
      schedule: Array(7).fill({ hours: '08:00 - 21:00' }).map((schedule, index) => ({
        day: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index],
        hours: schedule.hours,
      })),
    },
    {
      id: 2,
      name: 'Cancha 2',
      sport: 'Tenis',
      schedule: Array(7).fill({ hours: '08:00 - 21:00' }).map((schedule, index) => ({
        day: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index],
        hours: schedule.hours,
      })),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Mis canchas</h1>
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
            
            <div className="space-y-1 text-sm mb-4">
              {court.schedule.map(({ day, hours }) => (
                <p key={day} className="text-gray-500">
                  {day}: {hours}
                </p>
              ))}
            </div>
            
            <Button variant="outline" className="w-full">
              Modificar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};