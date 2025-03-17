export interface Event {
    id: number;
    ownerId: number;
    organizerType: string;
    schedule: string;
    ownerName: string;
    ownerPhone: string;
    ownerImage?: string;
    remaining?: number;
    location?: string;
    sportName?: string;
    description?: string;
    duration?: number;
}