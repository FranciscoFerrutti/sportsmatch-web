export interface Court {
    id: number;
    name: string;
    cost: number;
    description: string;
    capacity: number;
    slot_duration: number;
    sportIds: number[];
}

export type CourtUpdate = Partial<Court>;
export type CourtCreate = Omit<Court, 'id'>;
