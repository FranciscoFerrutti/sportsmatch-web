import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import apiClient from '@/apiClients';
import { useAuth } from '@/context/AppContext';

export const NewCourtForm = () => {
  const navigate = useNavigate();
  const { clubId } = useAuth();
  const apiKey = localStorage.getItem('c-api-key');

  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    description: '',
    capacity: '',
    slot_duration: '',
    sportIds: [] as number[],
  });

  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await apiClient.get('/sports', {
          headers: { 'c-api-key': apiKey },
        });
        setSports(response.data);
      } catch (error) {
        console.error('❌ Error obteniendo deportes:', error);
      }
    };

    fetchSports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clubId) {
      alert('Error: No hay club asociado.');
      return;
    }

    try {
      const payload = {
        ...formData,
        cost: parseFloat(formData.cost),
        capacity: parseInt(formData.capacity, 10),
        slot_duration: parseInt(formData.slot_duration, 10),
      };

      await apiClient.post(`/fields`, payload, {
        headers: { 'c-api-key': apiKey },
      });

      alert('✅ Cancha creada con éxito');
      navigate('/courts');
    } catch (error) {
      console.error('❌ Error al crear la cancha:', error);
      alert('No se pudo crear la cancha. Verifica los datos e intenta nuevamente.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    if (!isNaN(selectedId) && !formData.sportIds.includes(selectedId)) {
      setFormData(prev => ({
        ...prev,
        sportIds: [...prev.sportIds, selectedId],
      }));
      setHasChanges(true);
    }
  };

  const handleRemoveSport = (id: number) => {
    setFormData(prev => ({
      ...prev,
      sportIds: prev.sportIds.filter(sportId => sportId !== id),
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
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl">Nueva cancha</h1>
            <Button type="submit" className="bg-[#000066] hover:bg-[#000088]">
              Guardar
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
                    placeholder="Ingrese el nombre de la cancha"
                    className="w-full"
                    required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Descripción:</label>
                <Input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descripción de la cancha"
                    className="w-full"
                    required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Deporte:</label>
                <Select name="sportIds" onChange={handleSportChange} className="w-full">
                  <option value="">Seleccione un deporte</option>
                  {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                  ))}
                </Select>
                <div className="mt-2">
                  {formData.sportIds.map(id => {
                    const sport = sports.find(s => s.id === id);
                    return (
                        <div key={id} className="flex justify-between items-center p-2 bg-gray-100 rounded mt-1">
                          <span>{sport?.name || 'Deporte desconocido'}</span>
                          <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveSport(id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Costo por hora:</label>
                <Input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    placeholder="Ingrese el costo"
                    className="w-full"
                    min="0"
                    required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Capacidad:</label>
                <Input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="Cantidad de personas"
                    className="w-full"
                    min="1"
                    required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Duración de la franja horaria (minutos):</label>
                <Input
                    type="number"
                    name="slot_duration"
                    value={formData.slot_duration}
                    onChange={handleInputChange}
                    placeholder="Ejemplo: 60"
                    className="w-full"
                    min="10"
                    required
                />
              </div>
            </div>
          </div>
        </form>
      </div>
  );
};
