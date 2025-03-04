export interface Event {
    id: number;
    ownerId: number;
    organizerType: string;
    schedule: string;
    ownerName: string;
    ownerPhone: string;
    ownerImage?: string;
}