import React from 'react';
import { TimeSlot } from '@/types';

type CalendarCellProps = {
  slot: TimeSlot;
};

export const CalendarCell = ({ slot }: CalendarCellProps) => {
  const getStatusColor = (status: TimeSlot['status']) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  return (
    <td className="border p-2">
      <div className={`text-center p-1 rounded ${getStatusColor(slot.status)}`}>
        {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
      </div>
    </td>
  );
};