export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: number;
  fieldId: number;
  date: string;
  time: string;
  status: ReservationStatus;
}