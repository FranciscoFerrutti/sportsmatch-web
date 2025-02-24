import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import apiClient from '@/apiClients';
import { Field } from '@/types/fields';
import { useAuth } from '@/context/AppContext';

export const ModifyFieldsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fieldId = id ? parseInt(id, 10) : null;
  const { clubId } = useAuth(); // Asegurar que `clubId` esté disponible

  const [formData, setFormData] = useState<Partial<Field> | null>(null);
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiKey = localStorage.getItem('c-api-key');

  useEffect(() => {
    if (!fieldId || !clubId) {
      console.error('❌ Falta `clubId` o `fieldId`');
      navigate('/fields');
      return;
    }

    const fetchFieldAndSports = async () => {
      try {
        const [fieldResponse, sportsResponse] = await Promise.all([
          apiClient.get(`/fields/${fieldId}`, {
            headers: { 'c-api-key': apiKey },
            params: { clubId }
          }),
          apiClient.get('/sports', { headers: { 'c-api-key': apiKey } }),
        ]);

        console.log('✅ Datos de la cancha obtenidos:', fieldResponse.data);

        setSports(sportsResponse.data);
        setFormData({
          id: fieldResponse.data.id,
          name: fieldResponse.data.name,
          description: fieldResponse.data.description,
          cost: fieldResponse.data.cost_per_minute,
          capacity: fieldResponse.data.capacity,
          slot_duration: fieldResponse.data.slot_duration,
          sports: fieldResponse.data.sports || [],
        });
      } catch (err) {
        console.error('❌ Error obteniendo la cancha o deportes:', err);
        navigate('/fields');
      }
    };

    fetchFieldAndSports();
  }, [fieldId, clubId, navigate]);

  const updateField = async (redirectPath: string) => {
    setError(null);

    const requestBody = {
      name: formData?.name,
      description: formData?.description,
      cost: formData?.cost,
      capacity: formData?.capacity,
      slot_duration: formData?.slot_duration,
      sports: formData?.sports?.map(sport => sport.id) || []
    };

    try {
      await apiClient.put(`/fields/${fieldId}`, requestBody, {
        headers: { 'c-api-key': apiKey },
        params: { clubId }
      });

      console.log("✅ Cambios guardados correctamente.");
      navigate(redirectPath);
    } catch (err: any) {
      console.error('❌ Error al actualizar la cancha:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    updateField('/fields'); // Redirige a la lista de canchas
  };

  const handleModifySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateField(`/fields/${id}/schedule`); // Redirige a la asignación de horarios
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev!,
      [name]: name === 'slot_duration' || name === 'cost' ? Number(value) : value,
    }));
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedSport = sports.find(s => s.id === selectedId);
    if (selectedSport && !formData?.sports?.some(s => s.id === selectedId)) {
      setFormData(prev => ({
        ...prev!,
        sports: [...(prev?.sports || []), selectedSport],
      }));
    }
  };

  const handleRemoveSport = (id: number) => {
    setFormData(prev => ({
      ...prev!,
      sports: prev?.sports?.filter(sport => sport.id !== id) || [],
    }));
  };

  const durationOptions = [15, 30, 60, 90, 120];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder === 0 ? `${hours}:00 hs` : `${hours}:${remainder} hs`;
  };


  if (!formData) {
    return <div className="text-center p-6">Cargando datos de la cancha...</div>;
  }

  return (
      <div>
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/fields')} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <form className="p-6 mt-[-40px]">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl">Modificar cancha</h1>
            <div className="flex space-x-4">
              <Button onClick={handleSaveChanges} className="bg-[#000066] hover:bg-[#000088]">
                Guardar cambios
              </Button>
              <Button onClick={handleModifySchedule} className="bg-[#000066] hover:bg-[#000088]">
                Modificar horarios
              </Button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Nombre:</label>
                <Input type="text" name="name" value={formData.name || ''} onChange={handleInputChange}
                       className="w-full" required/>
              </div>

              <div>
                <label className="block mb-2 font-medium">Descripción:</label>
                <textarea name="description" value={formData.description || ''} onChange={handleInputChange}
                          placeholder="Ingrese una descripción breve" className="w-full p-2 border rounded-md"
                          required/>
              </div>

              <div>
                <label className="block mb-2 font-medium">Deporte:</label>
                <Select name="sports" onChange={handleSportChange} className="w-full">
                  <option value="">Seleccione un deporte</option>
                  {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                  ))}
                </Select>
                <div className="mt-2">
                  {formData.sports?.map(sport => (
                      <div key={sport.id} className="flex justify-between items-center p-2 bg-gray-100 rounded mt-1">
                        <span>{sport.name}</span>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleRemoveSport(sport.id)}>
                          Eliminar
                        </Button>
                      </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Costo por reserva:</label>
                <Input type="number" name="cost" value={formData.cost || ''} onChange={handleInputChange}
                       placeholder="Ingrese el costo" className="w-full" min="0" required/>
              </div>

              <div>
                <label className="block mb-2 font-medium">Capacidad:</label>
                <Input type="number" name="capacity" value={formData.capacity || ''} onChange={handleInputChange}
                       placeholder="Máximo 30 personas" className="w-full" min="1" max="30" required/>
              </div>

              <div>
                <label className="block mb-2 font-medium">Duración de reserva:</label>
                <Select name="slot_duration" value={formData.slot_duration} onChange={handleInputChange}
                        className="w-full">
                  <option value="" disabled>Seleccione la duración</option>
                  {durationOptions.map(minutes => (
                      <option key={minutes} value={minutes}>
                        {formatDuration(minutes)}
                      </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        </form>
      </div>
  );
};
