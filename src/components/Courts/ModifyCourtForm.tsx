import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import apiClient from '@/apiClients';
import { Court } from '@/types/courts';

export const ModifyCourtForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courtId = id ? parseInt(id) : null;

  const [formData, setFormData] = useState<Partial<Court>>({});
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiKey = localStorage.getItem('c-api-key');

  useEffect(() => {
    if (!courtId) {
      navigate('/courts');
      return;
    }

    const fetchCourt = async () => {
      try {
        const response = await apiClient.get(`/fields/${courtId}`, {
          headers: { 'c-api-key': apiKey },
        });
        setFormData(response.data);
      } catch (err) {
        console.error('❌ Error obteniendo la cancha:', err);
        navigate('/courts');
      }
    };

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

    fetchCourt();
    fetchSports();
  }, [courtId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await apiClient.put(`/fields/${courtId}`, formData, {
        headers: { 'c-api-key': apiKey },
      });

      alert('✅ Cancha actualizada con éxito');
      navigate('/courts');
    } catch (err: any) {
      console.error('❌ Error al actualizar la cancha:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['cost', 'capacity', 'slot_duration'].includes(name) ? Number(value) : value,
    }));
  };

  const handleSportIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSportId = parseInt(e.target.value, 10);
    setFormData(prev => ({
      ...prev,
      sportIds: selectedSportId ? [selectedSportId] : [],
    }));
  };

  return (
      <div>
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/courts')} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl">Modificar cancha</h1>
            <Button type="submit" className="bg-[#000066] hover:bg-[#000088]">
              Guardar cambios
            </Button>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Nombre:</label>
                <Input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full" required />
              </div>

              <div>
                <label className="block mb-2 font-medium">Deporte:</label>
                <Select name="sportIds" value={formData.sportIds?.[0] || ''} onChange={handleSportIdChange} className="w-full" required>
                  <option value="">Seleccione un deporte</option>
                  {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Costo (por hora):</label>
                <Input type="number" name="cost" value={formData.cost || ''} onChange={handleInputChange} placeholder="Ingrese el costo" className="w-full" min="0" required />
              </div>

              <div>
                <label className="block mb-2 font-medium">Capacidad:</label>
                <Input type="number" name="capacity" value={formData.capacity || ''} onChange={handleInputChange} placeholder="Ingrese la capacidad máxima" className="w-full" min="1" required />
              </div>

              <div>
                <label className="block mb-2 font-medium">Duración de reserva (minutos):</label>
                <Input type="number" name="slot_duration" value={formData.slot_duration || ''} onChange={handleInputChange} placeholder="Duración en minutos" className="w-full" min="15" required />
              </div>

              <div>
                <label className="block mb-2 font-medium">Descripción:</label>
                <textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Ingrese una descripción breve" className="w-full p-2 border rounded-md" required />
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        </form>
      </div>
  );
};
