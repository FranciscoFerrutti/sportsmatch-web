import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft, Save, Trash2 } from 'lucide-react';
import apiClient from '@/apiClients';
import { Field } from '@/types/fields';
import { useAuth } from '@/context/AppContext';

export const ModifyFieldsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fieldId = id ? parseInt(id, 10) : null;
  const { clubId } = useAuth();

  const [formData, setFormData] = useState<Partial<Field> | null>(null);
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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

        setSports(sportsResponse.data);
        setFormData({
          id: fieldResponse.data.id,
          name: fieldResponse.data.name,
          description: fieldResponse.data.description,
          cost: fieldResponse.data.cost_per_slot,
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

  const validateFields = () => {
    const errors: Record<string, string> = {};

    if (!formData?.name?.trim()) errors.name = 'El nombre es obligatorio';
    if (!formData?.description?.trim()) errors.description = 'La descripción es obligatoria';
    if (!formData?.cost || formData.cost <= 0) errors.cost = 'El costo debe ser mayor a 0';
    if (!formData?.capacity || formData.capacity <= 0) errors.capacity = 'La capacidad debe ser mayor a 0';
    if (!formData?.slot_duration || formData.slot_duration % 30 !== 0)
      errors.slot_duration = 'La duración debe ser un múltiplo de 30 minutos';
    if (!formData?.sports || formData.sports.length === 0) errors.sports = 'Debe seleccionar al menos un deporte';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateField = async (redirectPath: string) => {
    if (!validateFields()) return;

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

      // Check if the redirect path is for the schedule
      if (redirectPath.includes('/schedule')) {
        navigate(redirectPath, { state: { source: 'modify' } });
      } else {
      navigate(redirectPath);
      }
    } catch (err: any) {
      console.error('❌ Error al actualizar la cancha:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    updateField('/fields');
  };

  const handleModifySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateField(`/fields/${id}/schedule`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = name === 'slot_duration' || name === 'cost' ? Number(value) : value;

    if (name === 'slot_duration' && Number(newValue) % 30 !== 0) {
      return;
    }

    setFormData(prev => ({
      ...prev!,
      [name]: newValue,
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

  if (!formData) {
    return <div className="text-center p-6">Cargando datos de la cancha...</div>;
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 flex justify-center">
        <div className="max-w-3xl w-full">
          <div className="mb-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/fields')}
                className="flex items-center text-[#000066] hover:text-[#000088]"
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Volver
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h1 className="text-2xl font-bold text-[#000066] mb-6">Modificar Cancha</h1>

            <form className="space-y-6">
              <InputField label="Nombre:" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} />
              {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
              <TextAreaField label="Descripción:" name="description" value={formData.description} onChange={handleInputChange} error={formErrors.description} />
              {formErrors.description && <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>}
              {/* Deportes */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">Deporte:</label>
                <Select name="sports" onChange={handleSportChange} className="w-full">
                  <option value="">Seleccione un deporte</option>
                  {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>{sport.name}</option>
                  ))}
                </Select>
                <div className="mt-2 space-y-2">
                  {formData.sports?.map(sport => (
                      <div key={sport.id} className="flex justify-between items-center bg-blue-100 text-blue-800 p-2 rounded-lg">
                        <span>{sport.name}</span>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRemoveSport(sport.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                  ))}
                </div>
                {formErrors.sports && <p className="text-red-600 text-sm">{formErrors.sports}</p>}
              </div>

              <InputField label="Costo por turno:" name="cost" type="number" value={formData.cost} onChange={handleInputChange} error={formErrors.cost} />
              {formErrors.cost && <p className="text-red-600 text-sm mt-1">{formErrors.cost}</p>}
              <InputField label="Capacidad:" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} error={formErrors.capacity} />
              {formErrors.capacity && <p className="text-red-600 text-sm mt-1">{formErrors.capacity}</p>}
              <InputField label="Duración del turno (en minutos):" name="slot_duration" type="number" value={formData.slot_duration} onChange={handleInputChange} error={formErrors.slot_duration} />
              {formErrors.slot_duration && <p className="text-red-600 text-sm mt-1">{formErrors.slot_duration}</p>}
              <div className="flex justify-between mt-6">
                <Button className="bg-[#000066] hover:bg-[#000088]" onClick={handleSaveChanges}>
                  <Save className="w-5 h-5 mr-2" /> Guardar cambios
                </Button>
                <Button className="bg-[#000066] hover:bg-[#000088]" onClick={handleModifySchedule}>
                  Modificar horarios
                </Button>
              </div>
              {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
            </form>
          </div>
        </div>
      </div>
  );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, ...props }) => (
    <div>
      <label className="block font-medium text-gray-700 mb-1">{label}</label>
      <Input className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-300" {...props} />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, error, ...props }) => (
    <div>
      <label className="block font-medium text-gray-700 mb-1">{label}</label>
      <textarea className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-300" {...props} />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
);
