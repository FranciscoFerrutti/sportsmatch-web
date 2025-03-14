import {TimeSlot} from "./timeslot.ts";
import {Field} from "./fields.ts";
import {Event} from "./event.ts";

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Payment {
  isPaid: boolean;
  paymentDate: string | null;
  paymentAmount: string | null;
  isRefunded: boolean;
  refundDate: string | null;
  refundAmount: string | null;
}

export interface Reservation {
  id: number;
  field: Field;
  event: Event
  date: string;
  time: string;
  status: ReservationStatus;
  cost: number;
  timeSlot?: TimeSlot;
  payment?: Payment;
}