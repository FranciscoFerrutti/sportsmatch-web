import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import {useAuth} from "../../context/AppContext.tsx";
import {TimeSlot} from "../../types/timeslot.ts";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const apiKey = localStorage.getItem('c-api-key');
  const { clubId } = useAuth();
  const [fields, setFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clubId) {
      fetchFields();
    }
  }, [isOpen]);

  const fetchFields = async () => {
    try {
      const response = await apiClient.get(`/fields`, {
        headers: { "c-api-key": apiKey },
        params: { clubId }
      });
      setFields(response.data);
    } catch (error) {
      console.error("❌ Error al obtener las canchas:", error);
      alert("No se pudieron cargar las canchas.");
    }
  };

  const fetchAvailableTimeSlots = async () => {
    if (!selectedField || !selectedDate) return;

    try {
      const response = await apiClient.get(`/fields/${selectedField}/availability/available`, {
        headers: { "c-api-key": apiKey },
        params: {
          startDate: selectedDate,
          endDate: selectedDate,
        },
      });

      const availableSlots = response.data
          .filter((slot: TimeSlot) => slot.slotStatus === "available")
          .map((slot: any) => ({
            id: slot.id,
            availabilityDate: slot.availability_date,
            startTime: slot.start_time,
            endTime: slot.end_time,
            slotStatus: slot.slotStatus,
          }));

      setAvailableTimeSlots(availableSlots);

    } catch (error) {
      console.error("❌ Error obteniendo los timeslots disponibles:", error);
      setAvailableTimeSlots([]);
    }
  };

  useEffect(() => {
    fetchAvailableTimeSlots();
  }, [selectedField, selectedDate]);

  if (!isOpen) return null;

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedField) {
      setDateError("Seleccione una cancha primero.");
      setSelectedDate('');
      setFormattedDate(null);
      return;
    }

    setDateError(null);
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
      const selectedSlot = availableTimeSlots.find(slot => slot.startTime === selectedTime);

      if (!selectedSlot) {
        alert("Error: No se encontró el timeslot seleccionado.");
        setLoading(false);
        return;
      }

      await apiClient.patch(`/fields/${selectedField}/availability/${selectedSlot.id}/status`,
          { slotStatus: "booked" },
          { headers: { "c-api-key": apiKey } }
      );

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
                  disabled={!selectedField}
              />
              {dateError && <p className="text-sm text-red-600 mt-1">{dateError}</p>}
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
                  disabled={!selectedField || !selectedDate || availableTimeSlots.length === 0}
                  required
              >
                <option value="">Seleccionar horario</option>
                {availableTimeSlots.map(slot => (
                    <option key={slot.id} value={slot.startTime}>
                      {slot.startTime.slice(0, 5)}hs
                    </option>
                ))}
              </select>
              {selectedField && selectedDate && availableTimeSlots.length === 0 && (
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
