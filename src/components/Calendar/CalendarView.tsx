import React, { useState } from 'react';
import { Select } from '@/components/ui/select';
import { useFields } from '@/context/FieldsContext';
import type { TimeSlotStatus } from '@/context/FieldsContext';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: TimeSlotStatus) => void;
  currentSlot: {
    day: string;
    hour: number;
  } | null;
}

const SlotModal: React.FC<SlotModalProps> = ({ isOpen, onClose, onConfirm, currentSlot }) => {
  if (!isOpen || !currentSlot) return null;

  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {currentSlot.day} - {formatHour(currentSlot.hour)}
        </h3>
        <div className="space-y-4">
          <button 
            className="w-full p-2 text-left border rounded hover:bg-gray-50"
            onClick={() => onConfirm('Ocupado')}
          >
            Marcar como Ocupado
          </button>
          <button 
            className="w-full p-2 text-left border rounded hover:bg-gray-50"
            onClick={() => onConfirm('No disponible')}
          >
            Marcar como No disponible
          </button>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50 mt-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView = () => {
  const { fields, updateSlotStatus } = useFields();
  const [selectedField, setSelectedField] = useState(fields[0]?.id.toString() || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: string; hour: number} | null>(null);
  
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const selectedFieldData = fields.find(field => field.id.toString() === selectedField);

  const getWeekDayDate = (day: string) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysMap: Record<string, number> = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sábado': 6
    };

    let targetDay = daysMap[day];
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
  };

  const getTimeSlotStatus = (day: string, hour: number): TimeSlotStatus => {
    if (!selectedFieldData) return 'No disponible';

    const schedule = selectedFieldData.schedule[day];
    if (!schedule || schedule.closed) return 'No disponible';

    const currentTime = `${hour.toString().padStart(2, '0')}:00`;
    const startHour = parseInt(schedule.start.split(':')[0]);
    const endHour = parseInt(schedule.end.split(':')[0]);

    if (hour < startHour || hour >= endHour) return 'No disponible';

    const dateString = getWeekDayDate(day);

    const manualStatus = selectedFieldData.slotStatuses?.find(
      slot => slot.date === dateString && slot.time === currentTime
    );

    if (manualStatus) {
      return manualStatus.status;
    }

    const isOccupied = selectedFieldData.reservations.some(
      reservation =>
        reservation.status === 'accepted' &&
        reservation.date === dateString &&
        reservation.time === currentTime
    );

    return isOccupied ? 'Ocupado' : 'Disponible';
  };

  const getStatusClass = (status: TimeSlotStatus) => {
    const classes = {
      'Disponible': 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer',
      'Ocupado': 'bg-red-100 text-red-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'No disponible': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const handleSlotClick = (day: string, hour: number, status: TimeSlotStatus) => {
    if (status === 'Disponible') {
      setSelectedSlot({ day, hour });
      setIsModalOpen(true);
    }
  };

  const handleStatusChange = (newStatus: TimeSlotStatus) => {
    if (!selectedSlot || !selectedFieldData) return;

    const dateString = getWeekDayDate(selectedSlot.day);
    const timeString = `${selectedSlot.hour.toString().padStart(2, '0')}:00`;

    console.log('Updating slot status:', {
      fieldId: selectedFieldData.id,
      date: dateString,
      time: timeString,
      newStatus: newStatus
    });

    updateSlotStatus(selectedFieldData.id, dateString, timeString, newStatus);
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Calendario semanal</h1>
      
      <div className="mb-4">
        <Select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="w-48"
        >
          {fields.map(field => (
            <option key={field.id} value={field.id.toString()}>
              {field.name} - {field.sport}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50">Hora</th>
              {days.map(day => (
                <th key={day} className="border p-2 bg-gray-50">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="border p-2 text-center font-medium">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </td>
                {days.map(day => {
                  const status = getTimeSlotStatus(day, hour);
                  return (
                    <td key={`${day}-${hour}`} className="border p-2">
                      <div 
                        className={`text-center p-1 rounded ${getStatusClass(status)}`}
                        onClick={() => handleSlotClick(day, hour, status)}
                        title={status === 'No disponible' ? 'Fuera de horario' : status}
                      >
                        {status}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlotModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleStatusChange}
        currentSlot={selectedSlot}
      />
    </div>
  );
};

export default CalendarView;