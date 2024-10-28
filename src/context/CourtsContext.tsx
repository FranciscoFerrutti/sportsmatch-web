import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; 
import timezone from 'dayjs/plugin/timezone';

export type ReservationStatus = 'pending' | 'accepted' | 'rejected';
export type TimeSlotStatus = 'Disponible' | 'Ocupado' | 'Pendiente' | 'No disponible';

export interface Reservation {
  id: number;
  courtId: number;
  date: string;
  time: string;
  status: ReservationStatus;
}

export interface SlotStatus {
  date: string;
  time: string;
  status: TimeSlotStatus;
}

export interface Court {
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

interface CourtsContextType {
  courts: Court[];
  addCourt: (court: Omit<Court, 'id'>) => void;
  updateCourt: (id: number, court: Omit<Court, 'id'>) => void;
  deleteCourt: (id: number) => void;
  getCourtById: (id: number) => Court | undefined;
  updateReservationStatus: (courtId: number, reservationId: number, status: ReservationStatus) => boolean;
  isTimeSlotAvailable: (courtId: number, date: string, time: string) => boolean;
  updateSlotStatus: (courtId: number, date: string, time: string, status: TimeSlotStatus) => void;
  addReservation: (courtId: number, date: string, time: string) => void;
  cancelReservation: (courtId: number, reservationId: number) => void; // Added cancelReservation
}

const CourtsContext = createContext<CourtsContextType | undefined>(undefined);

const initialCourts: Court[] = [];

export const CourtsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courts, setCourts] = useState<Court[]>(() => {
    const savedCourts = localStorage.getItem('courts');
    if (savedCourts) {
      try {
        const parsed = JSON.parse(savedCourts);
        return parsed.map((court: any) => ({
          ...court,
          slotStatuses: Array.isArray(court.slotStatuses) ? court.slotStatuses : []
        }));
      } catch (error) {
        console.error('Error parsing courts from localStorage:', error);
        return initialCourts;
      }
    }
    return initialCourts;
  });

  useEffect(() => {
    localStorage.setItem('courts', JSON.stringify(courts));
  }, [courts]);

  const addCourt = (newCourt: Omit<Court, 'id'>) => {
    const nextId = Math.max(0, ...courts.map(c => c.id)) + 1;
    setCourts(prev => [
      ...prev,
      {
        ...newCourt,
        id: nextId,
        reservations: [],
        slotStatuses: []
      }
    ]);
  };

  const updateCourt = (id: number, updatedCourt: Omit<Court, 'id'>) => {
    setCourts(prev => prev.map(court => 
      court.id === id ? {
        ...updatedCourt,
        id,
        reservations: court.reservations,
        slotStatuses: Array.isArray(court.slotStatuses) ? court.slotStatuses : []
      } : court
    ));
  };

  const deleteCourt = (id: number) => {
    setCourts(prev => prev.filter(court => court.id !== id));
  };

  const getCourtById = (id: number) => {
    return courts.find(court => court.id === id);
  };

  const isTimeSlotAvailable = (courtId: number, date: string, time: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return false;
  
    const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
    const daySchedule = court.schedule[dayOfWeek];
  
    // Ensure the court is open on the specified day
    if (!daySchedule || daySchedule.closed) return false;
  
    const timeHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(daySchedule.start.split(':')[0], 10);
    const endHour = parseInt(daySchedule.end.split(':')[0], 10);
  
    // Ensure the selected time is within the court's open hours
    if (timeHour < startHour || timeHour >= endHour) return false;
  
    // Check for any manually blocked slots
    const manualStatus = court.slotStatuses.find(
      slot => slot.date === date && slot.time === time
    );
    if (manualStatus) {
      return manualStatus.status === 'Disponible';
    }
  
    // Check if the slot is already reserved
    return !court.reservations.some(
      reservation =>
        reservation.status === 'accepted' &&
        reservation.date === date &&
        reservation.time === time
    );
  };
  
  const updateReservationStatus = (
    courtId: number,
    reservationId: number,
    status: ReservationStatus
  ): boolean => {
    const court = courts.find(c => c.id === courtId);
    if (!court) {
      console.error('No court found with ID:', courtId);
      return false;
    }
  
    const reservation = court.reservations.find(r => r.id === reservationId);
    if (!reservation) {
      console.error('No reservation found with ID:', reservationId);
      return false;
    }
  
    console.log('Reservation before update:', reservation);
    reservation.status = status;
    console.log('Reservation after update:', reservation);
  
    setCourts(prevCourts =>
      prevCourts.map(c => (c.id === courtId ? { ...c, reservations: [...c.reservations] } : c))
    );
  
    return true;
  };
  

  const updateSlotStatus = (
    courtId: number,
    date: string,
    time: string,
    status: TimeSlotStatus
  ) => {
    setCourts(prevCourts =>
      prevCourts.map(court => {
        if (court.id === courtId) {
          const currentSlotStatuses = Array.isArray(court.slotStatuses) ? court.slotStatuses : [];
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
            ...court,
            slotStatuses: newSlotStatuses
          };
        }
        return court;
      })
    );
  };

  dayjs.extend(utc);
  dayjs.extend(timezone);

  const addReservation = (courtId: number, date: string, time: string) => {
    const localDate = dayjs.tz(date, 'YYYY-MM-DD', dayjs.tz.guess()).format('YYYY-MM-DD');
  
    console.log('Reserva - ID de la cancha:', courtId);
    console.log('Fecha de reserva recibida (date):', date);
    console.log('Fecha de reserva en local (localDate):', localDate);
    console.log('Hora de reserva (time):', time);
  
    setCourts(prevCourts => prevCourts.map(court => {
      if (court.id === courtId) {
        const nextId = Math.max(0, ...court.reservations.map(r => r.id)) + 1;
        return {
          ...court,
          reservations: [
            ...court.reservations,
            {
              id: nextId,
              courtId,
              date: localDate,
              time,
              status: 'pending'
            }
          ]
        };
      }
      return court;
    }));
  };
  

  const cancelReservation = (courtId: number, reservationId: number) => {
    setCourts(prevCourts => 
      prevCourts.map(court => {
        if (court.id === courtId) {
          return {
            ...court,
            reservations: court.reservations.map(reservation => 
              reservation.id === reservationId 
                ? { ...reservation, status: 'rejected' } 
                : reservation
            )
          };
        }
        return court;
      })
    );
  };
  

  return (
    <CourtsContext.Provider value={{
      courts,
      addCourt,
      updateCourt,
      deleteCourt,
      getCourtById,
      updateReservationStatus,
      isTimeSlotAvailable,
      updateSlotStatus,
      addReservation,
      cancelReservation // Include cancelReservation here
    }}>
      {children}
    </CourtsContext.Provider>

  );
};

export const useCourts = () => {
  const context = useContext(CourtsContext);
  if (context === undefined) {
    throw new Error('useCourts must be used within a CourtsProvider');
  }
  return context;
};