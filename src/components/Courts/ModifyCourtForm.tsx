// src/components/Courts/ModifyCourtForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCourts } from '@/context/CourtsContext';
import type { Court } from '@/context/CourtsContext';

type CourtFormData = Omit<Court, 'id'>;

export interface ModifyCourtFormProps {
  courtId: number;
  onSuccess?: () => void;
  onFormChange?: () => void;
}

export const ModifyCourtForm: React.FC<ModifyCourtFormProps> = ({ 
  courtId, 
  onSuccess,
  onFormChange 
}) => {
  const { updateCourt, getCourtById } = useCourts();
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const timeOptions = Array.from({ length: 14 }, (_, i) => 
    `${String(i + 8).padStart(2, '0')}:00`
  );

  const [formData, setFormData] = useState<CourtFormData>({
    name: '',
    sport: '',
    material: '',
    covered: 'cubierta',
    price: '',
    schedule: Object.fromEntries(
      days.map(day => [day, { start: '08:00', end: '21:00', closed: false }])
    ),
    reservations: []
  });

  useEffect(() => {
    const court = getCourtById(courtId);
    if (court) {
      const { id, ...courtData } = court;
      setFormData(courtData);
    }
  }, [courtId, getCourtById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourt(courtId, formData);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    onFormChange?.();
  };

  const handleScheduleChange = (
    day: string, 
    field: 'start' | 'end' | 'closed', 
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
    onFormChange?.();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Modificar cancha</h1>
        <Button 
          type="submit" 
          className="bg-[#000066] hover:bg-[#000088]"
        >
          Guardar
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Nombre:</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Deporte:</label>
            <Input
              type="text"
              name="sport"
              value={formData.sport}
              onChange={handleInputChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Material:</label>
            <Input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Cubierta:</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="covered"
                  checked={formData.covered === 'cubierta'}
                  onChange={() => {
                    setFormData(prev => ({ ...prev, covered: 'cubierta' }));
                    onFormChange?.();
                  }}
                  className="mr-2"
                  required
                />
                Cubierta
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="covered"
                  checked={formData.covered === 'descubierta'}
                  onChange={() => {
                    setFormData(prev => ({ ...prev, covered: 'descubierta' }));
                    onFormChange?.();
                  }}
                  className="mr-2"
                />
                Descubierta
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-2">Precio:</label>
            <Input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Horarios:</label>
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24">{day}:</span>
                  <Select
                    value={formData.schedule[day].start}
                    onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                    className="w-24"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </Select>
                  <span>a</span>
                  <Select
                    value={formData.schedule[day].end}
                    onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                    className="w-24"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleScheduleChange(
                      day, 
                      'closed', 
                      !formData.schedule[day].closed
                    )}
                    className={formData.schedule[day].closed ? 'bg-gray-100' : ''}
                  >
                    {formData.schedule[day].closed ? 'Cerrado' : 'Abierto'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {formData.reservations.length > 0 && (
            <div>
              <label className="block mb-2">Reservas actuales:</label>
              <div className="space-y-2">
                {formData.reservations.map(reservation => (
                  <div 
                    key={reservation.id} 
                    className="p-2 bg-gray-50 rounded border"
                  >
                    <p>Fecha: {reservation.date}</p>
                    <p>Hora: {reservation.time}</p>
                    <p>Estado: {reservation.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};