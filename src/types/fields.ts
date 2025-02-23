export interface Field {
    id: number;
    name: string;
    cost: number;
    description: string;
    capacity: number;
    slot_duration: number;
    sports: { id: number; name: string }[];
}

export type FieldCreate = Omit<Field, 'id' | 'sports'> & { sportIds: number[] };
export type CourtUpdate = Partial<FieldCreate>;
