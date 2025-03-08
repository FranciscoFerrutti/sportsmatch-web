export type TimeSlot = {
    id?: number;
    availabilityDate: string;
    startTime: string;
    endTime: string;
    slotStatus: "available" | "booked" | "maintenance";
    reservationId?: number
};
