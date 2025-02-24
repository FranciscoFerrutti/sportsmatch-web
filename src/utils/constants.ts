export const DAYS_OF_WEEK = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];
  
  export const BUSINESS_HOURS = Array.from(
    { length: 14 },
    (_, i) => `${String(i + 8).padStart(2, '0')}:00`
  );
  
  export const STATUS_COLORS = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800'
  } as const;