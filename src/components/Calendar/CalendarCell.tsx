import { TimeSlot } from '@/types/timeslot';

type CalendarCellProps = {
  slot: TimeSlot;
  fieldId: string;
  updateSlotStatus: (fieldId: string, slotId: number, newStatus: TimeSlot["slotStatus"]) => void;
};

export const CalendarCell = ({ slot, fieldId, updateSlotStatus }: CalendarCellProps) => {

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer',
      occupied: 'bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer',
      pending: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800 cursor-not-allowed'
    } as const;
    return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-600';
  };

  const handleClick = () => {
    if (slot.id === -1) return; // No hacer nada si es un slot ficticio

    const newStatus = slot.slotStatus === 'available' ? 'booked' : 'available';
    updateSlotStatus(fieldId, Number(slot.id), newStatus);
  };

  return (
      <td className="border p-2">
        <div
            className={`text-center p-1 rounded ${getStatusColor(slot.slotStatus)}`}
            onClick={handleClick}
        >
          {slot.slotStatus.charAt(0).toUpperCase() + slot.slotStatus.slice(1)}
        </div>
      </td>
  );
};