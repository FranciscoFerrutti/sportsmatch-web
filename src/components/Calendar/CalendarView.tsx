import { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import apiClient from '@/apiClients';
import { Field } from "../../types";
import { TimeSlot } from "../../types/timeslot.ts";
import { useAuth } from "../../context/AppContext.tsx";
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {DAYS_OF_WEEK} from "../../utils/constants.ts";

const CalendarView = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const apiKey = localStorage.getItem('c-api-key');
  const { clubId } = useAuth();
  const [slotDuration, setSlotDuration] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string, hour: string, slot: TimeSlot } | null>(null);


  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedField) {
      fetchTimeSlots(selectedField);
    }
  }, [selectedField, weekOffset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedSlot && !document.getElementById("slot-dropdown")?.contains(event.target as Node)) {
        setSelectedSlot(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedSlot]);


  const fetchFields = async () => {
    try {
      const response = await apiClient.get('/fields', {
        headers: { 'c-api-key': apiKey },
        params: { clubId }
      });

      setFields(response.data);

      if (response.data.length > 0) {
        setSelectedField(response.data[0].id.toString());
      } else {
        setSelectedField(null)
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
      const startOfCurrentWeek = dayjs().startOf('week').add(weekOffset * 7, 'day');

      const startDate = startOfCurrentWeek.format('YYYY-MM-DD');
      const endDate = startOfCurrentWeek.endOf('week').format('YYYY-MM-DD');

      const response = await apiClient.get(`/fields/${fieldId}/availability`, {
        headers: { "c-api-key": apiKey },
        params: { startDate, endDate },
      });

      const fieldsResponse = await apiClient.get(`/fields/${fieldId}`, {
        headers: { "c-api-key": apiKey },
      });

      const formattedSlots = response.data.map((slot: any) => ({
        id: slot.id,
        fieldId: slot.field_id,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        slotStatus: slot.slotStatus
      }));

      formattedSlots.sort((a : TimeSlot, b: TimeSlot) => {
        const dateComparison = a.date.localeCompare(b.date);
        return dateComparison !== 0 ? dateComparison : a.startTime.localeCompare(b.startTime);
      });

      setSlotDuration(fieldsResponse.data.slot_duration)
      setTimeSlots(formattedSlots);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error al obtener los timeslots:', error);
      setTimeSlots([]);
      setLoading(false);
    }
  };

  const generateTimeSlots = (): string[] => {
    if (!slotDuration || timeSlots.length === 0) {
      return [];
    }

    const firstTime = timeSlots.reduce((min, slot) => slot.startTime < min ? slot.startTime : min, timeSlots[0].startTime);
    const lastTime = timeSlots.reduce((max, slot) => slot.endTime > max ? slot.endTime : max, timeSlots[0].endTime);

    let timeArray: string[] = [];
    let currentHour = firstTime;

    while (currentHour < lastTime) {
      let nextHour = dayjs(`2025-01-01T${currentHour}`).add(slotDuration, "minute").format("HH:mm:ss");
      timeArray.push(`${currentHour.substring(0, 5)} - ${nextHour.substring(0, 5)}`);
      currentHour = nextHour;
    }

    return timeArray;
  };

  const getTimeSlotStatus = (day: string, hour: string): string => {
    const dateString = getWeekDayDate(day);
    const normalizedHour = hour.length === 5 ? `${hour}:00` : hour;

    const foundSlot = timeSlots.find(slot =>
        slot.date === dateString &&
        slot.startTime <= normalizedHour &&
        slot.endTime > normalizedHour
    );

    if (!foundSlot) return "No disponible";
    if (foundSlot.slotStatus === "maintenance") return "No disponible";
    if (foundSlot.slotStatus === "available") return "Disponible";
    if (foundSlot.slotStatus === "booked") return "Reservado";

    return "No disponible";
  };


  const handleSlotClick = (day: string, hour: string) => {
    const dateString = getWeekDayDate(day);
    const normalizedHour = hour.length === 5 ? `${hour}:00` : hour;

    let foundSlot: TimeSlot | undefined = timeSlots.find(slot =>
        slot.date === dateString &&
        slot.startTime <= normalizedHour &&
        slot.endTime > normalizedHour
    );

    if (!foundSlot) {
      foundSlot = {
        id: -1,
        date: dateString,
        startTime: normalizedHour,
        endTime: dayjs(`2025-01-01T${normalizedHour}`)
            .add(slotDuration ?? 0, "minute")
            .format("HH:mm:ss"),
        slotStatus: "maintenance"
      };
    }
    setSelectedSlot({ day, hour, slot: foundSlot });
  };

  const updateSlotStatus = async (newStatus: string) => {
    if (!selectedSlot) return;
    const { slot } = selectedSlot;

    if (slot === undefined) return;

    try {
      if (slot.slotStatus === "booked") {
        if (slot.reservationId) {
          await handleCancelReservation(slot.reservationId);
        }

        if (newStatus === "available") {
          await updateTimeSlot(slot.id!!, "available");
        } else if (newStatus === "maintenance") {
          await deleteTimeSlot(slot.id!!);
        }
      }

      else if (slot.slotStatus === "available") {
        if (newStatus === "maintenance") {
          await deleteTimeSlot(slot.id!!);
        } else if (newStatus === "booked") {
          await updateTimeSlot(slot.id!!, "booked");
        }
      }

      else if (slot.slotStatus === "maintenance") {
        if (newStatus === "available") {
          await createTimeSlot(slot.date, slot.startTime, slot.endTime, "available");
        } else if (newStatus === "booked") {
          await createTimeSlot(slot.date, slot.startTime, slot.endTime, "booked");
        }
      }

      setSelectedSlot(null);
    } catch (error) {
      console.error("❌ Error al actualizar slot:", error);
    }
  };

  const updateTimeSlot = async (slotId: number, status: string) => {
    await apiClient.patch(`/fields/${selectedField}/availability/${slotId}/status`, {
      slotStatus: status
    }, { headers: { "c-api-key": apiKey } });

    setTimeSlots(prev =>
        prev.map(s =>
            s.id === slotId
                ? { ...s, slotStatus: status as "available" | "booked" | "maintenance" }
                : s
        )
    );
  };


  const deleteTimeSlot = async (slotId: number) => {
    try {
      const slot = timeSlots.find(s => s.id === slotId);

      if (slot?.reservationId) {
        await handleCancelReservation(slot.reservationId);
      }

      await apiClient.delete(`/fields/${selectedField}/availability/${slotId}`, {
        headers: { "c-api-key": apiKey }
      });

      setTimeSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (error) {
      console.error("❌ Error al eliminar el timeslot:", error);
    }
  };


  const createTimeSlot = async (date: string, start: string, end: string, status: string) => {
    const formattedStart = start.substring(0, 5);
    const formattedEnd = end.substring(0, 5);

    const response = await apiClient.post(`/fields/${selectedField}/availability`, {
      date: date,
      startTime: formattedStart,
      endTime: formattedEnd,
      slotStatus: status
    }, { headers: { "c-api-key": apiKey } });

    setTimeSlots(prev => [...prev, response.data]);
  };


  const handleCancelReservation = async (reservationId: number) => {
    try {
      await apiClient.patch(`/reservations/${reservationId}/status`, {
        status: 'cancelled'
      }, {
        headers: { 'c-api-key': apiKey },
      });

      setTimeSlots(prev =>
          prev.map(s => s.reservationId === reservationId ? { ...s, eventId: null, slotStatus: "available" } : s)
      );

      setSelectedSlot(null);
    } catch (error) {
      console.error("❌ Error al cancelar reserva:", error);
    }
  };

  const getStatusOptions = (slot: TimeSlot) => {
    if (slot.slotStatus === "available") {
      return [
        { label: "Marcar como ocupado", action: () => updateSlotStatus("booked") },
        { label: "Marcar como no disponible", action: () => updateSlotStatus("maintenance") }
      ];
    } else if (slot.slotStatus === "booked") {
      return slot.reservationId
          ? [{ label: "Cancelar reserva", action: () => handleCancelReservation(slot.reservationId!!) }]
          : [
            { label: "Marcar como disponible", action: () => updateSlotStatus("available") },
            { label: "Marcar como no disponible", action: () => updateSlotStatus("maintenance") }
          ];
    } else {
      return [
        { label: "Marcar como disponible", action: () => updateSlotStatus("available") },
        { label: "Marcar como ocupado", action: () => updateSlotStatus("booked") }
      ];
    }
  };

  const getWeekDayDate = (day: string) => {
    const startOfWeek = dayjs().startOf('week').add(weekOffset * 7, 'day');
    const index = DAYS_OF_WEEK.indexOf(day);
    return startOfWeek.add(index, 'day').format("YYYY-MM-DD");
  };

  const getStatusClass = (status: string) => {
    const normalizedStatus = status === "maintenance" ? "No disponible" : status;

    const classes = {
      'Disponible': 'bg-green-100 text-green-800',
      'Reservado': 'bg-red-100 text-red-800',
      'No disponible': 'bg-gray-200 text-gray-600'
    } as const;

    return classes[normalizedStatus as keyof typeof classes] || 'bg-gray-200 text-gray-600';
  };

  const timeSlotsFormatted = generateTimeSlots();

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
          <h1 className="text-2xl font-bold text-[#000066]">Calendario semanal</h1>

        {/* 📌 Manejo de canchas vacías */}
        {fields.length === 0 ? (
            <p className="text-center text-gray-500">No hay canchas registradas.</p>
        ) : (
            <>

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

        {slotDuration && (
            <p className="text-center text-gray-700 font-medium mb-2">
              Duración del slot: {slotDuration} minutos
            </p>
        )}

        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setWeekOffset(weekOffset - 1)}
                  className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200">
            <ChevronLeft className="h-5 w-5"/>
          </button>
          <span className="text-lg font-medium">
          {dayjs().startOf('week').add(weekOffset * 7, 'day').format("DD MMM")} -
            {dayjs().endOf('week').add(weekOffset * 7, 'day').format("DD MMM")}
        </span>
          <button onClick={() => setWeekOffset(weekOffset + 1)}
                  className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200">
            <ChevronRight className="h-5 w-5"/>
          </button>
        </div>

        {/* Tabla de horarios */}
        {loading ? (
            <p className="text-center text-gray-500">Cargando timeslots...</p>
        ) : (
            <>
              {timeSlotsFormatted.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg bg-white shadow-lg">
                  <table className="w-full border-collapse">
                    <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50">Horario</th>
                      {DAYS_OF_WEEK.map((day, index) => {
                        const dayDate = dayjs().startOf('week').add(weekOffset * 7 + index, 'day').format("DD");
                        return (
                            <th key={day} className="border p-2 bg-gray-50">
                              {day} {dayDate}
                            </th>
                        );
                      })}
                    </tr>
                    </thead>

                    <tbody>
                    {timeSlotsFormatted.map((timeRange) => (
                        <tr key={timeRange}>
                          <td className="border p-2 text-center font-medium">{timeRange}</td>
                          {DAYS_OF_WEEK.map((day) => (
                              <td key={`${day}-${timeRange}`} className="border p-2"
                                  onClick={() => handleSlotClick(day, timeRange.split(" - ")[0])}>
                                <div
                                    className={`text-center p-1 rounded ${getStatusClass(getTimeSlotStatus(day, timeRange.split(" - ")[0]))}`}
                                >
                                  {getTimeSlotStatus(day, timeRange.split(" - ")[0])}
                                </div>
                                {selectedSlot?.day === day && selectedSlot.hour === timeRange.split(" - ")[0] && (
                                    <div id="slot-dropdown" className="absolute bg-white shadow-md rounded-md p-2 mt-1 z-10">
                                      {getStatusOptions(selectedSlot.slot).map(option => (
                                          <button key={option.label} className="block w-full text-left p-1 hover:bg-gray-200" onClick={option.action}>
                                            {option.label}
                                          </button>
                                      ))}
                                    </div>
                                )}
                              </td>
                          ))}
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                  <p className="text-gray-600">No hay horarios disponibles para esta cancha en la semana seleccionada.</p>
                </div>
              )}
            </>
        )}
            </>
        )}
      </div>
  );
};

export default CalendarView;
