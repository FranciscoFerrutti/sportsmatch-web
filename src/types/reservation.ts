import {TimeSlot} from "./timeslot.ts";

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: number;
  fieldId: number;
  date: string;
  time: string;
  status: ReservationStatus;
  cost: number;
  timeSlots?: TimeSlot[];
  ownerId?: number;
}