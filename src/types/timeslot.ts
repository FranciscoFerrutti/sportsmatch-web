export type TimeSlot = {
    id?: number;
    date: string;
    startTime: string;
    endTime: string;
    slotStatus: "available" | "booked" | "maintenance";
    reservationId?: number
};
