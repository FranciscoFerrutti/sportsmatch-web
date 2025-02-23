import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone';

export type ReservationStatus = 'pending' | 'accepted' | 'rejected';
export type TimeSlotStatus = 'Disponible' | 'Ocupado' | 'Pendiente' | 'No disponible';

export interface Reservation {
  id: number;
  fieldId: number;
  date: string;
  time: string;
  status: ReservationStatus;
}

export interface SlotStatus {
  date: string;
  time: string;
  status: TimeSlotStatus;
}

export interface Field {
  id: number;
  name: string;
  sport: string;
  material: string;
  covered: 'cubierta' | 'descubierta';
  price: string;
  schedule: Record<string, {
    start: string;
    end: string;
    closed: boolean;
  }>;
  reservations: Reservation[];
  slotStatuses: SlotStatus[];
}

interface FieldsContextType {
  fields: Field[];
  addField: (field: Omit<Field, 'id'>) => void;
  updateField: (id: number, field: Omit<Field, 'id'>) => void;
  deleteField: (id: number) => void;
  getFieldById: (id: number) => Field | undefined;
  updateReservationStatus: (fieldId: number, reservationId: number, status: ReservationStatus) => boolean;
  isTimeSlotAvailable: (fieldId: number, date: string, time: string) => boolean;
  updateSlotStatus: (fieldId: number, date: string, time: string, status: TimeSlotStatus) => void;
  addReservation: (fieldId: number, date: string, time: string) => void;
  cancelReservation: (fieldId: number, reservationId: number) => void;
}

const FieldsContext = createContext<FieldsContextType | undefined>(undefined);

const initialFields: Field[] = [];

export const FieldsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fields, setFields] = useState<Field[]>(() => {
    const savedFields = localStorage.getItem('fields');
    if (savedFields) {
      try {
        const parsed = JSON.parse(savedFields);
        return parsed.map((field: any) => ({
          ...field,
          slotStatuses: Array.isArray(field.slotStatuses) ? field.slotStatuses : []
        }));
      } catch (error) {
        console.error('Error parsing fields from localStorage:', error);
        return initialFields;
      }
    }
    return initialFields;
  });

  useEffect(() => {
    localStorage.setItem('fields', JSON.stringify(fields));
  }, [fields]);

  const addField = (newField: Omit<Field, 'id'>) => {
    const nextId = Math.max(0, ...fields.map(c => c.id)) + 1;
    setFields(prev => [
      ...prev,
      {
        ...newField,
        id: nextId,
        reservations: [],
        slotStatuses: []
      }
    ]);
  };

  const updateField = (id: number, updatedField: Omit<Field, 'id'>) => {
    setFields(prev => prev.map(field => 
      field.id === id ? {
        ...updatedField,
        id,
        reservations: field.reservations,
        slotStatuses: Array.isArray(field.slotStatuses) ? field.slotStatuses : []
      } : field
    ));
  };

  const deleteField = (id: number) => {
    setFields(prev => prev.filter(field => field.id !== id));
  };

  const getFieldById = (id: number) => {
    return fields.find(field => field.id === id);
  };

  const isTimeSlotAvailable = (fieldId: number, date: string, time: string) => {
    const field = fields.find(c => c.id === fieldId);
    if (!field) return false;
  
    const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
    const daySchedule = field.schedule[dayOfWeek];

    if (!daySchedule || daySchedule.closed) return false;
  
    const timeHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(daySchedule.start.split(':')[0], 10);
    const endHour = parseInt(daySchedule.end.split(':')[0], 10);

    if (timeHour < startHour || timeHour >= endHour) return false;

    const manualStatus = field.slotStatuses.find(
      slot => slot.date === date && slot.time === time
    );
    if (manualStatus) {
      return manualStatus.status === 'Disponible';
    }

    return !field.reservations.some(
      reservation =>
        reservation.status === 'accepted' &&
        reservation.date === date &&
        reservation.time === time
    );
  };
  
  const updateReservationStatus = (
    fieldId: number,
    reservationId: number,
    status: ReservationStatus
  ): boolean => {
    const field = fields.find(c => c.id === fieldId);
    if (!field) {
      console.error('No field found with ID:', fieldId);
      return false;
    }
  
    const reservation = field.reservations.find(r => r.id === reservationId);
    if (!reservation) {
      console.error('No reservation found with ID:', reservationId);
      return false;
    }
  
    console.log('Reservation before update:', reservation);
    reservation.status = status;
    console.log('Reservation after update:', reservation);
  
    setFields(prevFields =>
      prevFields.map(c => (c.id === fieldId ? { ...c, reservations: [...c.reservations] } : c))
    );
  
    return true;
  };
  

  const updateSlotStatus = (
    fieldId: number,
    date: string,
    time: string,
    status: TimeSlotStatus
  ) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === fieldId) {
          const currentSlotStatuses = Array.isArray(field.slotStatuses) ? field.slotStatuses : [];
          const existingIndex = currentSlotStatuses.findIndex(
            slot => slot.date === date && slot.time === time
          );

          let newSlotStatuses;
          if (existingIndex >= 0) {
            newSlotStatuses = [...currentSlotStatuses];
            newSlotStatuses[existingIndex] = { date, time, status };
          } else {
            newSlotStatuses = [...currentSlotStatuses, { date, time, status }];
          }

          return {
            ...field,
            slotStatuses: newSlotStatuses
          };
        }
        return field;
      })
    );
  };

  dayjs.extend(utc);
  dayjs.extend(timezone);

  const addReservation = (fieldId: number, date: string, time: string) => {
    const localDate = dayjs.tz(date, 'YYYY-MM-DD', dayjs.tz.guess()).format('YYYY-MM-DD');
  
    console.log('Reserva - ID de la cancha:', fieldId);
    console.log('Fecha de reserva recibida (date):', date);
    console.log('Fecha de reserva en local (localDate):', localDate);
    console.log('Hora de reserva (time):', time);
  
    setFields(prevFields => prevFields.map(field => {
      if (field.id === fieldId) {
        const nextId = Math.max(0, ...field.reservations.map(r => r.id)) + 1;
        return {
          ...field,
          reservations: [
            ...field.reservations,
            {
              id: nextId,
              fieldId,
              date: localDate,
              time,
              status: 'pending'
            }
          ]
        };
      }
      return field;
    }));
  };
  

  const cancelReservation = (fieldId: number, reservationId: number) => {
    setFields(prevFields => 
      prevFields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            reservations: field.reservations.map(reservation => 
              reservation.id === reservationId 
                ? { ...reservation, status: 'rejected' } 
                : reservation
            )
          };
        }
        return field;
      })
    );
  };
  

  return (
    <FieldsContext.Provider value={{
      fields,
      addField,
      updateField,
      deleteField,
      getFieldById,
      updateReservationStatus,
      isTimeSlotAvailable,
      updateSlotStatus,
      addReservation,
      cancelReservation
    }}>
      {children}
    </FieldsContext.Provider>

  );
};

export const useFields = () => {
  const context = useContext(FieldsContext);
  if (context === undefined) {
    throw new Error('useFields must be used within a FieldsProvider');
  }
  return context;
};