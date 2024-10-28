import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourts } from '@/context/CourtsContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export const HomeView = () => {
  const { courts, updateReservationStatus } = useCourts();

  const pendingReservations = courts.flatMap(court =>
    court.reservations
      .filter(r => r.status === 'pending')
      .map(r => ({ 
        ...r, 
        courtName: court.name, 
        courtId: court.id 
      }))
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
  );

  const upcomingReservations = courts.flatMap(court =>
    court.reservations
      .filter(r => r.status === 'accepted')
      .map(r => ({
        ...r,
        courtName: court.name,
        courtId: court.id
      }))
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5)
  );

  const handleAccept = async (courtId: number, reservationId: number) => {
    const success = updateReservationStatus(courtId, reservationId, 'accepted');
    
    if (!success) {
      alert('No se puede aceptar la reserva porque el horario ya no está disponible');
      console.error('Error al aceptar la reserva:', { courtId, reservationId });
    } else {
      console.log('Reserva aceptada:', { courtId, reservationId });
    }
  };  
  

  const handleReject = (courtId: number, reservationId: number) => {
    updateReservationStatus(courtId, reservationId, 'rejected');
  };

  const formatDate = (dateStr: string) => {
    dayjs.locale('es');
    dayjs.extend(utc);
    dayjs.extend(timezone);
    return dayjs.tz(dateStr, dayjs.tz.guess()).format('dddd, D [de] MMMM [de] YYYY');
  };

  const formatTime = (time: string) => {
    return time.replace(':00', 'hs');
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateStr);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getRelativeDate = (dateStr: string) => {
    if (isToday(dateStr)) return 'Hoy';
    if (isTomorrow(dateStr)) return 'Mañana';
    return formatDate(dateStr);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Inicio</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Reservas pendientes de aprobación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingReservations.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-6 text-center text-gray-500">
                No hay reservas pendientes
              </Card>
            </div>
          ) : (
            pendingReservations.map(reservation => (
              <Card key={reservation.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{reservation.courtName}</h3>
                    <div className="space-y-1">
                      <p className="text-gray-600">
                        {getRelativeDate(reservation.date)}
                      </p>
                      <p className="text-gray-600">
                        {formatTime(reservation.time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleAccept(reservation.courtId, reservation.id)}
                    >
                      Aceptar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(reservation.courtId, reservation.id)}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Próximas reservas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingReservations.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-6 text-center text-gray-500">
                No hay próximas reservas
              </Card>
            </div>
          ) : (
            upcomingReservations.map(reservation => (
              <Card 
                key={reservation.id} 
                className="p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-1">{reservation.courtName}</h3>
                <div className="space-y-1">
                  <p className="text-gray-600">
                    {getRelativeDate(reservation.date)}
                  </p>
                  <p className="text-gray-600">
                    {formatTime(reservation.time)}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};