// src/components/Courts/NewCourtForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface TimeSlot {
  start: string;
  end: string;
  closed: boolean;
}

interface CourtFormData {
  name: string;
  sport: string;
  material: string;
  covered: 'cubierta' | 'descubierta';
  price: string;
  schedule: Record<string, TimeSlot>;
}

export const NewCourtForm = () => {
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
    )
  });

  const handleScheduleChange = (day: string, field: keyof TimeSlot, value: string | boolean) => {
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
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl">Nueva cancha</h1>
        <Button className="bg-[#000066] hover:bg-[#000088]">
          Guardar
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Nombre:</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-2">Deporte:</label>
            <Input
              type="text"
              value={formData.sport}
              onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-2">Material:</label>
            <Input
              type="text"
              value={formData.material}
              onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
              className="w-full"
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
                  onChange={() => setFormData(prev => ({ ...prev, covered: 'cubierta' }))}
                  className="mr-2"
                />
                Cubierta
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="covered"
                  checked={formData.covered === 'descubierta'}
                  onChange={() => setFormData(prev => ({ ...prev, covered: 'descubierta' }))}
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
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full"
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
                    variant="outline"
                    onClick={() => handleScheduleChange(day, 'closed', !formData.schedule[day].closed)}
                  >
                    {formData.schedule[day].closed ? 'Cerrado' : 'Abierto'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};