import {useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select } from "@/components/ui/select";
import {ChevronDown, ChevronLeft, Copy} from 'lucide-react';
import apiClient from '@/apiClients';
import {DAYS_OF_WEEK} from "../../utils/constants.ts";
import {TimeSlot} from "../../types/timeslot.ts";

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
    const [copyFromDay, setCopyFromDay] = useState<string | null>(null);
    const [copyToDays, setCopyToDays] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    useEffect(() => {
        const fetchExistingTimeSlots = async () => {
            try {
                const response = await apiClient.get(`/fields/${id}/availability`, {
                    headers: { "c-api-key": apiKey },
                });

                const existingSlots: TimeSlot[] = response.data;

                const updatedSchedule = DAYS_OF_WEEK.map(day => {
                    // Convert from DAYS_OF_WEEK index (where 0 = Monday) to JS Date index (where 0 = Sunday)
                    const dayIndexInArray = DAYS_OF_WEEK.indexOf(day);
                    const jsDateIndex = dayIndexInArray === 6 ? 0 : dayIndexInArray + 1;
                    
                    const slotsForDay = existingSlots.filter(slot => {
                        const slotDate = new Date(slot.availabilityDate);
                        return slotDate.getDay() === jsDateIndex;
                    });

                    if (slotsForDay.length > 0) {
                        slotsForDay.sort((a, b) => a.startTime.localeCompare(b.startTime));

                        return {
                            day,
                            startTime: formatTime(slotsForDay[0].startTime),
                            endTime: formatTime(slotsForDay[slotsForDay.length - 1].endTime),
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

    const handleCopySchedule = () => {
        if (!copyFromDay || copyToDays.length === 0) return;

        const referenceSlot = schedule.find((slot) => slot.day === copyFromDay);
        if (!referenceSlot) return;

        setSchedule((prev) =>
            prev.map((slot) =>
                copyToDays.includes(slot.day)
                    ? { ...slot, startTime: referenceSlot.startTime, endTime: referenceSlot.endTime, closed: referenceSlot.closed }
                    : slot
            )
        );

        setCopyFromDay(null);
        setCopyToDays([]);
        setShowDropdown(null);
    };

    const handleBack = () => navigate(`/fields/${id}/edit`);

    const handleTimeChange = (index: number, key: "startTime" | "endTime", value: string) => {
        setSchedule(prev => prev.map((slot, i) => {
            if (i !== index) return slot;

            let newSlot = { ...slot, [key]: value, error: "" };

            if (key === "startTime" && newSlot.endTime && value >= newSlot.endTime) {
                newSlot.error = "La hora de apertura debe ser menor a la de cierre.";
            }

            if (key === "endTime" && newSlot.startTime && value <= newSlot.startTime) {
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

    const getNextDatesForDay = (dayName: string): string[] => {
        const today = new Date();
        const todayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Convert from DAYS_OF_WEEK index (where 0 = Monday) to JS Date index (where 0 = Sunday)
        // Lunes (Monday) is at index 0 in DAYS_OF_WEEK but index 1 in JS Date
        const dayIndexInArray = DAYS_OF_WEEK.indexOf(dayName);
        const targetIndex = dayIndexInArray === 6 ? 0 : dayIndexInArray + 1;

        if (dayIndexInArray === -1) throw new Error(`Día inválido: ${dayName}`);

        let daysToAdd = targetIndex - todayIndex;
        if (daysToAdd <= 0) daysToAdd += 7;

        const dates = [];
        for (let i = 0; i < 12; i++) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + daysToAdd + (i * 7));
            dates.push(targetDate.toISOString().split("T")[0]);
        }

        return dates;
    };

    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hours = Math.floor(i / 2)
            .toString()
            .padStart(2, "0");
        const minutes = i % 2 === 0 ? "00" : "30";
        return `${hours}:${minutes}`;
    });


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
        try {
            const existingSlots: TimeSlot[] = await fetchExistingTimeSlots();

            if (existingSlots.length > 0) {

                const batchSize = 50;
                for (let i = 0; i < existingSlots.length; i += batchSize) {
                    const batch = existingSlots.slice(i, i + batchSize);

                    await Promise.allSettled(
                        batch.map(slot =>
                            apiClient.delete(`/fields/${id}/availability/${slot.id}`, {
                                headers: { "c-api-key": apiKey },
                            })
                        )
                    );

                    console.log(`🗑️ Batch DELETE ${i / batchSize + 1} completado`);
                }
            }

            console.log("✅ Eliminación completada. Creando nuevos time slots...");

            const newSlots: Omit<TimeSlot, "id">[] = [];

            for (const slot of schedule) {
                if (slot.closed || !slot.startTime || !slot.endTime) continue;

                const slotsToCreate = generateTimeSlots(slot.startTime, slot.endTime, slotDuration!);
                const availabilityDates = getNextDatesForDay(slot.day);

                for (const date of availabilityDates) {
                    for (const timeSlot of slotsToCreate) {
                        newSlots.push({
                            availabilityDate: date,
                            startTime: formatTime(timeSlot.startTime),
                            endTime: formatTime(timeSlot.endTime),
                            slotStatus: "available",
                        });
                    }
                }
            }

            if (newSlots.length === 0) {
                console.error("⚠️ No se generaron nuevos time slots.");
                return;
            }

            console.log(`⏳ Creando ${newSlots.length} nuevos time slots en batches...`);

            const batchSize = 50;
            for (let i = 0; i < newSlots.length; i += batchSize) {
                const batch = newSlots.slice(i, i + batchSize);

                await Promise.allSettled(
                    batch.map(slot =>
                        apiClient.post(`/fields/${id}/availability`, slot, {
                            headers: { "c-api-key": apiKey },
                        })
                    )
                );

                console.log(`✅ Batch POST ${i / batchSize + 1} completado`);
            }

            console.log("🚀 Todos los time slots han sido creados exitosamente.");
        } catch (error) {
            console.error("❌ Error al sincronizar time slots:", error);
            throw error;
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const errors: string[] = [];
        schedule.forEach((slot, index) => {
            if (!slot.closed && (!slot.startTime || !slot.endTime)) {
                errors[index] = "⚠️ Por favor complete este horario.";
            }
        });

        if (errors.length > 0) {
            setFormErrors(errors);
            setIsLoading(false);
            return;
        }


        try {
            await syncTimeSlots();
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
                                <div className="flex justify-between items-center">
                                    <label className="font-medium">{slot.day}</label>
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-600 border-blue-600 hover:bg-blue-50 flex items-center"
                                            onClick={() => {
                                                setCopyFromDay(slot.day);
                                                setShowDropdown(prev => (prev === slot.day ? null : slot.day));
                                            }}
                                        >
                                            <Copy className="w-4 h-4 mr-2"/> Copiar <ChevronDown
                                            className="w-4 h-4 ml-1"/>
                                        </Button>
                                        {showDropdown === slot.day && (
                                            <div
                                                className="absolute top-10 right-0 bg-white border rounded-lg shadow-lg p-4 z-10 w-48">
                                                <label className="block font-medium mb-2 text-sm">
                                                    Copiar a:
                                                </label>
                                                {DAYS_OF_WEEK.filter((day) => day !== slot.day).map((day) => (
                                                    <div key={day} className="flex items-center space-x-2">
                                                        <input type="checkbox" onChange={(e) => {
                                                            setCopyToDays(e.target.checked
                                                                ? [...copyToDays, day]
                                                                : copyToDays.filter(d => d !== day)
                                                            );
                                                        }}/>
                                                        <span>{day}</span>
                                                    </div>
                                                ))}
                                                <Button
                                                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={handleCopySchedule}
                                                >
                                                    Confirmar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                            <Select value={slot.startTime}
                                                    onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}>
                                                <option value="">Seleccione...</option>
                                                {timeOptions.map((time) => (
                                                    <option key={time} value={time}>
                                                        {time}
                                                    </option>
                                                ))}
                                            </Select>
                                            {formErrors[index] &&
                                                <p className="text-red-600 text-sm mt-1">{formErrors[index]}</p>}
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-sm text-gray-600 mb-1">Hora de cierre</label>
                                            <Select value={slot.endTime}
                                                    onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}>
                                                <option value="">Seleccione...</option>
                                                {timeOptions.map((time) => (
                                                    <option key={time} value={time}>
                                                        {time}
                                                    </option>
                                                ))}
                                            </Select>
                                            {formErrors[index] &&
                                                <p className="text-red-600 text-sm mt-1">{formErrors[index]}</p>}
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