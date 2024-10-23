// src/types/reservation.ts
export type ReservationStatus = 'pending' | 'accepted' | 'rejected';

export interface Reservation {
  id: number;
  courtId: number;
  date: string;
  time: string;
  status: ReservationStatus;
}