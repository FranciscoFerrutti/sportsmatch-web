export type TimeSlot = {
    id?: number;
    availabilityDate: string;
    startTime: string;
    endTime: string;
    slotStatus: "available" | "booked" | "maintenance";
    reservationId?: number
};

export type GetTimeSlot = {
    id?: number;
    availability_date: string;
    start_time: string;
    end_time: string;
    slotStatus: "available" | "booked" | "maintenance";
    reservationId?: number
};
