import {TimeSlot} from "./timeslot.ts";
import {Field} from "./fields.ts";
import {Event} from "./event.ts";

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: number;
  field: Field;
  event: Event
  date: string;
  time: string;
  status: ReservationStatus;
  cost: number;
  timeSlot?: TimeSlot
}