import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import { useCourts } from '@/context/CourtsContext';
import type { Court } from '@/context/CourtsContext';

type CourtFormData = Omit<Court, 'id'>;

export const ModifyCourtForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courtId = id ? parseInt(id) : null;
  
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
    reservations: [],
    slotStatuses: []
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!courtId) {
      navigate('/courts');
      return;
    }

    const court = getCourtById(courtId);
    if (court) {
      const { id, ...courtData } = court;
      setFormData(courtData);
    } else {
      navigate('/courts');
    }
  }, [courtId, getCourtById, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courtId) {
      updateCourt(courtId, formData);
      setHasChanges(false);
      navigate('/courts');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const handleBack = () => {
    if (!hasChanges || window.confirm('¿Está seguro que desea volver? Los cambios no guardados se perderán.')) {
      navigate('/courts');
    }
  };

  return (
    <div>
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl">Modificar cancha</h1>
          <Button 
            type="submit" 
            className="bg-[#000066] hover:bg-[#000088]"
          >
            Guardar cambios
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Nombre:</label>
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
              <label className="block mb-2 font-medium">Deporte:</label>
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
              <label className="block mb-2 font-medium">Material:</label>
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
              <label className="block mb-2 font-medium">Cubierta:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="covered"
                    checked={formData.covered === 'cubierta'}
                    onChange={() => {
                      setFormData(prev => ({ ...prev, covered: 'cubierta' }));
                      setHasChanges(true);
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
                      setHasChanges(true);
                    }}
                    className="mr-2"
                  />
                  Descubierta
                </label>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">Precio:</label>
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
              <label className="block mb-2 font-medium">Horarios:</label>
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {days.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 font-medium">{day}:</span>
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
                      className={`min-w-[100px] ${formData.schedule[day].closed ? 'bg-gray-100' : ''}`}
                    >
                      {formData.schedule[day].closed ? 'Cerrado' : 'Abierto'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};