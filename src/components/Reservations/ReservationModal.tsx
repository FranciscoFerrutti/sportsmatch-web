import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import {useAuth} from "../../context/AppContext.tsx";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const apiKey = localStorage.getItem('c-api-key');
  const { clubId } = useAuth(); // Asegúrate de que el clubId está almacenado
  const [fields, setFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clubId) {
      fetchFields();
    }
  }, [isOpen]);

  const fetchFields = async () => {
    try {
      const response = await apiClient.get(`/fields/${clubId}`, {
        headers: { "c-api-key": apiKey },
      });
      setFields(response.data);
    } catch (error) {
      console.error("❌ Error al obtener las canchas:", error);
      alert("No se pudieron cargar las canchas.");
    }
  };

  if (!isOpen) return null;

  const selectedFieldData = fields.find(field => field.id.toString() === selectedField);

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  const getAvailableTimes = () => {
    if (!selectedFieldData || !selectedDate) return [];

    const dayOfWeek = dayjs(selectedDate).locale('es').format('dddd');
    const day = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

    const schedule = selectedFieldData.schedule?.[day];
    if (!schedule || schedule.closed) return [];

    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);

    const slotDuration = selectedFieldData.slot_duration || 60; // Duración del turno de la cancha
    const times: string[] = [];

    for (let hour = startHour; hour < endHour; hour += slotDuration / 60) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;

      const isReserved = selectedFieldData.reservations?.some(
          (reservation: { date: string; time: string; status: string; }) =>
              reservation.date === selectedDate &&
              reservation.time === timeString &&
              reservation.status === 'accepted'
      );

      const isBlocked = selectedFieldData.slotStatuses?.some(
          (slot: { date: string; time: string; status: string; }) =>
              slot.date === selectedDate &&
              slot.time === timeString &&
              (slot.status === 'Ocupado' || slot.status === 'No disponible')
      );

      if (!isReserved && !isBlocked) {
        times.push(timeString);
      }
    }

    return times;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const localDate = dayjs(date).tz(dayjs.tz.guess());
    setSelectedDate(localDate.format('YYYY-MM-DD'));
    setFormattedDate(localDate.locale('es').format('dddd, D [de] MMMM [de] YYYY'));
    setSelectedTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey) {
      alert("Error: No se encontró la API Key.");
      return;
    }

    setLoading(true);

    try {
      const localDate = dayjs.tz(selectedDate, 'YYYY-MM-DD', dayjs.tz.guess()).format('YYYY-MM-DD');
      const localTime = dayjs(`${selectedDate}T${selectedTime}`).format('HH:mm');

      console.log("📤 Enviando reserva:", { fieldId: selectedField, date: localDate, time: localTime });

      await apiClient.post(`/reservations`, {
        fieldId: parseInt(selectedField),
        date: localDate,
        time: localTime,
      }, {
        headers: { "c-api-key": apiKey },
      });

      alert("✅ Reserva creada con éxito");
      onClose();
      setSelectedField('');
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error("❌ Error al crear la reserva:", error);
      alert("No se pudo crear la reserva. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Nueva Reserva</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Cancha:</label>
              <select
                  value={selectedField}
                  onChange={(e) => {
                    setSelectedField(e.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full p-2 border rounded"
                  required
              >
                <option value="">Seleccionar cancha</option>
                {fields.map(field => (
                    <option key={field.id} value={field.id.toString()}>
                      {field.name} - {field.sports.map((sport: any) => sport.name).join(', ')}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Fecha:</label>
              <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={minDate}
                  max={maxDate}
                  className="w-full p-2 border rounded"
                  required
              />
              {formattedDate && (
                  <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">Horario:</label>
              <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border rounded"
                  disabled={!selectedField || !selectedDate}
                  required
              >
                <option value="">Seleccionar horario</option>
                {getAvailableTimes().map(time => (
                    <option key={time} value={time}>{time}hs</option>
                ))}
              </select>
              {selectedField && selectedDate && getAvailableTimes().length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No hay horarios disponibles para esta fecha
                  </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                  type="submit"
                  className="bg-[#000066] hover:bg-[#000088]"
                  disabled={!selectedField || !selectedDate || !selectedTime || loading}
              >
                {loading ? 'Guardando...' : 'Crear reserva'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
  );
};
