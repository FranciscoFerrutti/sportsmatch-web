import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import apiClient from '@/apiClients';
import { Field } from "../../types";
import { TimeSlot } from "../../types/timeslot.ts";
import { useAuth } from "../../context/AppContext.tsx";
import dayjs from 'dayjs';
import { DAYS_OF_WEEK } from "../../utils/constants.ts";

const ORDERED_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // Domingo al final

const CalendarView = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const apiKey = localStorage.getItem('c-api-key');
  const { clubId } = useAuth();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedField) {
      fetchTimeSlots(selectedField);
    }
  }, [selectedField]);

  const fetchFields = async () => {
    try {
      const response = await apiClient.get('/fields', {
        headers: { 'c-api-key': apiKey },
        params: { clubId }
      });

      setFields(response.data);

      if (response.data.length > 0) {
        setSelectedField(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('❌ Error al obtener las canchas:', error);
    }
  };

  const fetchTimeSlots = async (fieldId: string) => {
    if (!apiKey) {
      console.error("❌ No se encontró la API Key.");
      return;
    }

    setLoading(true);
    try {
      const startDate = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'); // Lunes
      const endDate = dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD'); // Domingo

      const response = await apiClient.get(`/fields/${fieldId}/availability`, {
        headers: { "c-api-key": apiKey },
        params: { startDate, endDate },
      });

      console.log("✅ TimeSlots obtenidos:", response.data);

      const formattedSlots = response.data.map((slot: any) => ({
        id: slot.id,
        fieldId: slot.field_id,
        availabilityDate: slot.availability_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        slotStatus: slot.slotStatus,
      }));

      formattedSlots.sort((a, b) => {
        const dateComparison = a.availabilityDate.localeCompare(b.availabilityDate);
        if (dateComparison !== 0) return dateComparison;
        return a.startTime.localeCompare(b.startTime);
      });

      setTimeSlots(formattedSlots);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error al obtener los timeslots:', error);
      setTimeSlots([]);
      setLoading(false);
    }
  };

  const generateTimeSlots = (): string[] => {
    if (timeSlots.length === 0) {
      console.warn("⚠️ No hay timeslots disponibles.");
      return [];
    }

    console.log("🛠️ Procesando timeslots:", timeSlots);

    const firstTime = timeSlots.reduce((min, slot) => slot.startTime < min ? slot.startTime : min, timeSlots[0].startTime);
    const lastTime = timeSlots.reduce((max, slot) => slot.endTime > max ? slot.endTime : max, timeSlots[0].endTime);

    console.log(`⏳ Generando slots desde ${firstTime} hasta ${lastTime}`);

    let timeArray: string[] = [];
    let currentHour = firstTime;

    while (currentHour < lastTime) {
      let nextHour = dayjs(`2025-01-01T${currentHour}`).add(30, "minute").format("HH:mm:ss");
      timeArray.push(`${currentHour.substring(0, 5)} - ${nextHour.substring(0, 5)}`);
      currentHour = nextHour;
    }

    console.log("✅ Horarios generados correctamente:", timeArray);
    return timeArray;
  };

  const getTimeSlotStatus = (day: string, hour: string): string => {
    const dateString = getWeekDayDate(day);
    const normalizedHour = hour.length === 5 ? `${hour}:00` : hour; // aseguramos formato HH:mm:ss

    console.log(`🔍 Buscando slots para ${dateString} - ${normalizedHour}`);

    const foundSlot = timeSlots.find(slot =>
        slot.availabilityDate === dateString &&
        slot.startTime <= normalizedHour &&
        slot.endTime > normalizedHour
    );

    return foundSlot?.slotStatus || 'No disponible';
  };

  const getWeekDayDate = (day: string) => {
    const startOfWeek = dayjs().startOf('week').add(1, 'day'); // Empezamos en lunes
    const index = ORDERED_DAYS.indexOf(day);
    return startOfWeek.add(index, 'day').format("YYYY-MM-DD");
  };

  const getStatusClass = (status: string) => {
    const classes = {
      'available': 'bg-green-100 text-green-800',
      'booked': 'bg-red-100 text-red-800',
      'maintenance': 'bg-gray-100 text-gray-800',
      'No disponible': 'bg-gray-200 text-gray-600',
    } as const;
    return classes[status as keyof typeof classes] || 'bg-gray-200 text-gray-600';
  };

  const timeSlotsFormatted = generateTimeSlots();

  return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Calendario semanal</h1>

        {/* Selector de cancha */}
        <div className="mb-4">
          <Select
              value={selectedField || ''}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-48"
          >
            {fields.map(field => (
                <option key={field.id} value={field.id.toString()}>
                  {field.name}
                </option>
            ))}
          </Select>
        </div>

        {/* Tabla de horarios */}
        {loading ? (
            <p className="text-center text-gray-500">Cargando timeslots...</p>
        ) : (
            <div className="overflow-x-auto border rounded-lg bg-white shadow-lg">
              <table className="w-full border-collapse">
                <thead>
                <tr>
                  <th className="border p-2 bg-gray-50">Horario</th>
                  {ORDERED_DAYS.map((day, index) => {
                    const dayDate = dayjs().startOf('week').add(index + 1, 'day').format("DD"); // Lunes como inicio
                    return (
                        <th key={day} className="border p-2 bg-gray-50">
                          {day} {dayDate}
                        </th>
                    );
                  })}
                </tr>
                </thead>

                <tbody>
                {timeSlotsFormatted.map(timeRange => (
                    <tr key={timeRange}>
                      <td className="border p-2 text-center font-medium">{timeRange}</td>
                      {ORDERED_DAYS.map(day => (
                          <td key={`${day}-${timeRange}`} className="border p-2">
                          <div className={`text-center p-1 rounded ${getStatusClass(getTimeSlotStatus(day, timeRange.split(" - ")[0]))}`}>
                              {getTimeSlotStatus(day, timeRange.split(" - ")[0])}
                            </div>
                          </td>
                      ))}
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
};

export default CalendarView;
