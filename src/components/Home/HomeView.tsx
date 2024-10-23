// src/components/Home/HomeView.tsx
import React from 'react';
import { Card } from '../../components/ui/card';
// or if you prefer relative imports:
// import { Card } from '@/components/ui/card';

type Reservation = {
  id: number;
  court: string;
  date: string;
  time: string;
};

export const HomeView = () => {
  const pendingReservations: Reservation[] = [
    { id: 1, court: "Cancha 6", date: "21 de Diciembre 2024", time: "17:30hs" },
    { id: 2, court: "Cancha 1", date: "21 de Diciembre 2024", time: "17:45hs" }
  ];

  const upcomingReservations: Reservation[] = [
    { id: 3, court: "Cancha 3", date: "27 de Noviembre 2024", time: "11:30hs" },
    { id: 4, court: "Cancha 1", date: "01 de Diciembre 2024", time: "19:00hs" },
    { id: 5, court: "Cancha 2", date: "24 de Noviembre 2024", time: "20:00hs" }
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl mb-6">Inicio</h1>
      
      <div className="mb-8">
        <h2 className="text-lg mb-4">Reservas pendientes de aprobación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingReservations.map(reservation => (
            <Card key={reservation.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{reservation.court}</p>
                  <p className="text-gray-600">{reservation.date}</p>
                  <p className="text-gray-600">{reservation.time}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-50">
                    Aceptar
                  </button>
                  <button className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50">
                    Rechazar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg mb-4">Próximas reservas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingReservations.map(reservation => (
            <Card key={reservation.id} className="p-4">
              <p className="font-bold">{reservation.court}</p>
              <p className="text-gray-600">{reservation.date}</p>
              <p className="text-gray-600">{reservation.time}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};