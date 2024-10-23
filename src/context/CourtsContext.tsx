// src/context/CourtsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ReservationStatus = 'pending' | 'accepted' | 'rejected';

export interface Reservation {
  id: number;
  courtId: number;
  date: string;
  time: string;
  status: ReservationStatus;
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
}

interface CourtsContextType {
  courts: Court[];
  addCourt: (court: Omit<Court, 'id'>) => void;
  updateCourt: (id: number, court: Omit<Court, 'id'>) => void;
  deleteCourt: (id: number) => void;
  getCourtById: (id: number) => Court | undefined;
  updateReservationStatus: (courtId: number, reservationId: number, status: ReservationStatus) => boolean;
  isTimeSlotAvailable: (courtId: number, date: string, time: string) => boolean;
}

const CourtsContext = createContext<CourtsContextType | undefined>(undefined);

// Initial data
const initialCourts: Court[] = [
  {
    id: 1,
    name: 'Cancha 1',
    sport: 'Tenis',
    material: 'Césped sintético',
    covered: 'descubierta',
    price: '5000',
    schedule: {
      'Lunes': { start: '08:00', end: '21:00', closed: false },
      'Martes': { start: '08:00', end: '21:00', closed: false },
      'Miércoles': { start: '08:00', end: '21:00', closed: false },
      'Jueves': { start: '08:00', end: '21:00', closed: false },
      'Viernes': { start: '08:00', end: '21:00', closed: false },
      'Sábado': { start: '08:00', end: '21:00', closed: false },
      'Domingo': { start: '08:00', end: '21:00', closed: false },
    },
    reservations: [
      {
        id: 1,
        courtId: 1,
        date: '2024-10-24',
        time: '17:00',
        status: 'pending'
      }
    ]
  }
];

export const CourtsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or use initial data
  const [courts, setCourts] = useState<Court[]>(() => {
    const savedCourts = localStorage.getItem('courts');
    if (savedCourts) {
      try {
        return JSON.parse(savedCourts);
      } catch (error) {
        console.error('Error parsing courts from localStorage:', error);
        return initialCourts;
      }
    }
    return initialCourts;
  });

  // Save to localStorage whenever courts change
  useEffect(() => {
    localStorage.setItem('courts', JSON.stringify(courts));
  }, [courts]);

  const addCourt = (newCourt: Omit<Court, 'id'>) => {
    const nextId = Math.max(0, ...courts.map(c => c.id)) + 1;
    setCourts(prev => [...prev, { ...newCourt, id: nextId, reservations: [] }]);
  };

  const updateCourt = (id: number, updatedCourt: Omit<Court, 'id'>) => {
    setCourts(prev => prev.map(court => 
      court.id === id ? { ...updatedCourt, id, reservations: court.reservations } : court
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

    // Check if the court is open at this time
    const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
    const daySchedule = court.schedule[dayOfWeek];
    
    if (!daySchedule || daySchedule.closed) return false;

    const timeHour = parseInt(time.split(':')[0]);
    const startHour = parseInt(daySchedule.start.split(':')[0]);
    const endHour = parseInt(daySchedule.end.split(':')[0]);

    if (timeHour < startHour || timeHour >= endHour) return false;

    // Check if there's no accepted reservation for this slot
    return !court.reservations.some(
      reservation => 
        reservation.status === 'accepted' &&
        reservation.date === date &&
        reservation.time === time
    );
  };

  const updateReservationStatus = (courtId: number, reservationId: number, status: ReservationStatus): boolean => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return false;

    const reservation = court.reservations.find(r => r.id === reservationId);
    if (!reservation) return false;

    // If trying to accept, check if slot is available
    if (status === 'accepted') {
      const isAvailable = isTimeSlotAvailable(courtId, reservation.date, reservation.time);
      if (!isAvailable) return false;
    }

    setCourts(prevCourts => 
      prevCourts.map(c => {
        if (c.id === courtId) {
          return {
            ...c,
            reservations: c.reservations.map(r => 
              r.id === reservationId ? { ...r, status } : r
            )
          };
        }
        return c;
      })
    );

    return true;
  };

  return (
    <CourtsContext.Provider value={{ 
      courts, 
      addCourt, 
      updateCourt, 
      deleteCourt, 
      getCourtById,
      updateReservationStatus,
      isTimeSlotAvailable
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