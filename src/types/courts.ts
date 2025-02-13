export interface Court {
    id: number;
    name: string;
    cost: number;
    description: string;
    capacity: number;
    slot_duration: number;
    sports: { id: number; name: string }[];
}

export type CourtCreate = Omit<Court, 'id' | 'sports'> & { sportIds: number[] };
export type CourtUpdate = Partial<CourtCreate>;
