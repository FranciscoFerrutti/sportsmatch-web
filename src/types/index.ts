export type Reservation = {
    id: number;
    court: string;
    date: string;
    time: string;
  };
  
  export type Court = {
    id: number;
    name: string;
    sport: string;
    schedule?: {
      [key: string]: string[];
    };
  };
  
  export type TimeSlot = {
    status: 'available' | 'occupied' | 'pending' | 'closed';
    time: string;
  };
  