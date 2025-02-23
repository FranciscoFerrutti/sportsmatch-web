import {useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import apiClient from '@/apiClients';
import {DAYS_OF_WEEK} from "../../utils/constants.ts";

interface TimeSlot {
    id?: number;
    field_id: number;
    reservationId?: number | null;
    availability_date: string;
    start_time: string;
    end_time: string;
    slotStatus: "available" | "booked" | "maintenance";
    created_at?: string;
    updated_at?: string;
}

interface ScheduleSlot {
    day: string;
    startTime: string;
    endTime: string;
    slots: TimeSlot[];
    closed: boolean;
    error: string;
}

export const AssignSchedule = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const apiKey = localStorage.getItem('c-api-key');
    const [isLoading, setIsLoading] = useState(false);
    const [slotDuration, setSlotDuration] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<ScheduleSlot[]>(
        DAYS_OF_WEEK.map(day => ({ day, startTime: "", endTime: "", slots: [], closed: false, error: "" }))
    );

    useEffect(() => {
        const fetchExistingTimeSlots = async () => {
            try {
                const response = await apiClient.get(`/fields/${id}/availability`, {
                    headers: { "c-api-key": apiKey },
                });

                const existingSlots: TimeSlot[] = response.data;

                const updatedSchedule = DAYS_OF_WEEK.map(day => {
                    const slotsForDay = existingSlots.filter(slot =>
                        new Date(slot.availability_date).getDay() === DAYS_OF_WEEK.indexOf(day)
                    );

                    if (slotsForDay.length > 0) {
                        slotsForDay.sort((a, b) => a.start_time.localeCompare(b.start_time));

                        return {
                            day,
                            startTime: formatTime(slotsForDay[0].start_time),
                            endTime: formatTime(slotsForDay[slotsForDay.length - 1].end_time),
                            slots: slotsForDay,
                            closed: false,
                            error: "",
                        };
                    } else {
                        return { day, startTime: "", endTime: "", slots: [], closed: false, error: "" };
                    }
                });

                setSchedule(updatedSchedule);
            } catch (error) {
                console.error("❌ Error obteniendo timeSlots existentes:", error);
            }
        };

        fetchExistingTimeSlots();
    }, [id]);


    useEffect(() => {
        const fetchFieldData = async () => {
            try {
                const response = await apiClient.get(`/fields/${id}`, {headers: {'c-api-key': apiKey}})
                console.log("Field data: ", response.data)
                setSlotDuration(response.data.slot_duration);
            } catch (error) {
                console.error("Error obteniendo slot duration:", error);
            }
        };
        fetchFieldData();
    }, [id]);


    const generateTimeSlots = (startTime: string, endTime: string, interval: number) => {
        const slots = [];
        let [hours, minutes] = startTime.split(":").map(Number);
        let [endHours, endMinutes] = endTime.split(":").map(Number);

        while (hours < endHours || (hours === endHours && minutes < endMinutes)) {
            let newHours = hours;
            let newMinutes = minutes + interval;
            if (newMinutes >= 60) {
                newHours += Math.floor(newMinutes / 60);
                newMinutes %= 60;
            }

            if (newHours > endHours || (newHours === endHours && newMinutes > endMinutes)) {
                break;
            }

            slots.push({
                startTime: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
                endTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
                slotStatus: "available",
            });

            hours = newHours;
            minutes = newMinutes;
        }

        return slots;
    };


    const handleBack = () => navigate(`/fields/${id}/edit`);

    // Redondear a intervalos de 15 minutos (00, 15, 30, 45)
    const roundToNearest15Min = (time: string) => {
        if (!time) return time;
        const [hours, minutes] = time.split(":").map(Number);
        const roundedMinutes = Math.round(minutes / 15) * 15;
        const newMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
        const newHours = roundedMinutes === 60 ? hours + 1 : hours;
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    };

    const handleTimeChange = (index: number, key: "startTime" | "endTime", value: string) => {
        const roundedValue = roundToNearest15Min(value);
        setSchedule(prev => prev.map((slot, i) => {
            if (i !== index) return slot;

            let newSlot = { ...slot, [key]: roundedValue, error: "" };

            if (key === "startTime" && newSlot.endTime && roundedValue >= newSlot.endTime) {
                newSlot.error = "La hora de apertura debe ser menor a la de cierre.";
            }

            if (key === "endTime" && newSlot.startTime && roundedValue <= newSlot.startTime) {
                newSlot.error = "La hora de cierre debe ser mayor a la de apertura.";
            }

            return newSlot;
        }));
    };

    const handleClosedChange = (index: number) => {
        setSchedule(prev => prev.map((slot, i) =>
            i === index ? { ...slot, closed: !slot.closed, startTime: "", endTime: "", error: "" } : slot
        ));
    };

    const getNextDateForDay = (dayName: string): string => {
        const today = new Date();
        const todayIndex = today.getDay(); // Índice del día actual (0=Domingo, 1=Lunes, etc.)
        const targetIndex = DAYS_OF_WEEK.indexOf(dayName);

        if (targetIndex === -1) throw new Error(`Día inválido: ${dayName}`);

        let daysToAdd = targetIndex - todayIndex;
        if (daysToAdd < 0) daysToAdd += 7;

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysToAdd);

        return targetDate.toISOString().split("T")[0];
    };

    const formatTime = (time: string): string => {
        return time ? time.slice(0, 5) : "";
    };

    const fetchExistingTimeSlots = async (): Promise<TimeSlot[]> => {
        try {
            const response = await apiClient.get(`/fields/${id}/availability`, {
                headers: { "c-api-key": apiKey },
            });
            return response.data as TimeSlot[];
        } catch (error) {
            console.error("❌ Error obteniendo timeSlots existentes:", error);
            return [];
        }
    };


    const syncTimeSlots = async () => {
        const existingSlots: TimeSlot[] = await fetchExistingTimeSlots();
        const newSlots: Omit<TimeSlot, "id" | "created_at" | "updated_at">[] = [];

        for (const slot of schedule) {
            if (slot.closed || !slot.startTime || !slot.endTime) continue;

            const slotsToCreate = generateTimeSlots(slot.startTime, slot.endTime, slotDuration!);
            const availabilityDate = getNextDateForDay(slot.day);

            for (const timeSlot of slotsToCreate) {
                newSlots.push({
                    field_id: Number(id),
                    availability_date: availabilityDate,
                    start_time: formatTime(timeSlot.startTime),
                    end_time: formatTime(timeSlot.endTime),
                    slotStatus: "available",
                });
            }
        }

        if (existingSlots.length === 0) {
            console.log("📌 Primera carga de horarios: agregando todos los `timeSlots`.");
            for (const slot of newSlots) {
                await apiClient.post(`/fields/${id}/availability`, slot, {
                    headers: { "c-api-key": apiKey },
                });
            }
            return;
        }

        const slotsToDelete = existingSlots.filter((existingSlot: TimeSlot) =>
            !newSlots.some((newSlot) =>
                existingSlot.availability_date === newSlot.availability_date &&
                existingSlot.start_time === newSlot.start_time &&
                existingSlot.end_time === newSlot.end_time
            )
        );

        const slotsToAdd = newSlots.filter((newSlot) =>
            !existingSlots.some((existingSlot: TimeSlot) =>
                existingSlot.availability_date === newSlot.availability_date &&
                existingSlot.start_time === newSlot.start_time &&
                existingSlot.end_time === newSlot.end_time
            )
        );

        console.log("🗑️ Slots a eliminar:", slotsToDelete);
        console.log("➕ Slots a agregar:", slotsToAdd);

        for (const slot of slotsToDelete) {
            await apiClient.delete(`/fields/${id}/availability/${slot.id}`, {
                headers: { "c-api-key": apiKey },
            });
        }

        for (const slot of slotsToAdd) {
            await apiClient.post(`/fields/${id}/availability`, slot, {
                headers: { "c-api-key": apiKey },
            });
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await syncTimeSlots();
            alert("✅ Horarios actualizados con éxito");
            navigate('/fields');
        } catch (error) {
            console.error("❌ Error al actualizar horarios:", error);
            alert("No se pudo actualizar los horarios. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="p-4">
                <Button variant="ghost" onClick={handleBack} className="mb-4">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Volver
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 mt-[-40px]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl">Asignar horarios</h1>
                    <Button type="submit" className="bg-[#000066] hover:bg-[#000088]" disabled={isLoading}>
                        {isLoading ? "Guardando horarios..." : "Guardar horarios"}
                    </Button>
                </div>

                {isLoading && (
                    <div className="text-center text-blue-600 font-medium my-4">
                        ⏳ Por favor aguarde, se están actualizando los horarios...
                    </div>
                )}

                <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow-sm">
                    <div className="space-y-4">
                        {schedule.map((slot, index) => (
                            <div key={slot.day} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                                <label className="block font-medium mb-2">{slot.day}</label>
                                <div className="flex items-center space-x-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={slot.closed}
                                        onChange={() => handleClosedChange(index)}
                                        className="cursor-pointer"
                                    />
                                    <span>No disponible</span>
                                </div>
                                {!slot.closed && (
                                    <div className="flex space-x-4">
                                        <div className="w-1/2">
                                            <label className="block text-sm text-gray-600 mb-1">Hora de apertura</label>
                                            <Input
                                                type="time"
                                                value={slot.startTime}
                                                onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                                                required
                                                step="900"
                                                lang="es"
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-sm text-gray-600 mb-1">Hora de cierre</label>
                                            <Input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                                                required
                                                step="900"
                                                lang="es"
                                            />
                                        </div>
                                    </div>
                                )}
                                {slot.error && <p className="text-red-600 text-sm mt-1">{slot.error}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};
