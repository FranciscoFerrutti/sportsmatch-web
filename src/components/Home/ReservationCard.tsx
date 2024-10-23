import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Reservation } from '@/types';

type ReservationCardProps = {
  reservation: Reservation;
  isPending?: boolean;
};

export const ReservationCard = ({ reservation, isPending }: ReservationCardProps) => (
  <Card className="p-4">
    <div className="flex justify-between items-center">
      <div>
        <p className="font-bold">{reservation.court}</p>
        <p className="text-gray-600">{reservation.date}</p>
        <p className="text-gray-600">{reservation.time}</p>
      </div>
      {isPending && (
        <div className="flex space-x-2">
          <Button variant="outline" className="text-green-600">Aceptar</Button>
          <Button variant="outline" className="text-red-600">Rechazar</Button>
        </div>
      )}
    </div>
  </Card>
);