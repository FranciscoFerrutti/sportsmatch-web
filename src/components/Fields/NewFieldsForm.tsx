import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
import apiClient from '@/apiClients';
import { useAuth } from '@/context/AppContext';

export const NewFieldsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clubId } = useAuth();
  const apiKey = localStorage.getItem('c-api-key');
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have preserved data from the previous form
  const preservedData = location.state?.preservedData;

  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    description: '',
    capacity: '',
    slot_duration: '',
    sports: [] as { id: number; name: string }[],
  });

  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load preserved data if available
  useEffect(() => {
    if (preservedData) {
      setFormData({
        name: preservedData.name || '',
        description: preservedData.description || '',
        cost: preservedData.cost?.toString() || '',
        capacity: preservedData.capacity?.toString() || '',
        slot_duration: preservedData.slot_duration?.toString() || '',
        sports: preservedData.sports || [],
      });
    }
  }, [preservedData]);

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

  const validateFields = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) errors.name = "El nombre es obligatorio.";
    if (!formData.description.trim()) errors.description = "La descripción es obligatoria.";
    if (!formData.cost || isNaN(Number(formData.cost)) || Number(formData.cost) <= 0) errors.cost = "Ingrese un costo válido mayor a 0.";
    if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1 || Number(formData.capacity) > 30) {
      errors.capacity = "La capacidad debe estar entre 1 y 30.";
    }
    if (!formData.slot_duration) errors.slot_duration = "Seleccione una duración válida.";
    if (formData.sports.length === 0) errors.sports = "Seleccione al menos un deporte.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!validateFields()) {
      setIsLoading(false);
      return;
    }

    if (!clubId) {
      alert('Error: No hay club asociado.');
      setIsLoading(false);
      return;
    }

    const parsedCapacity = parseInt(formData.capacity, 10);
    const parsedCost = parseFloat(formData.cost);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        cost: parsedCost,
        capacity: parsedCapacity,
        slot_duration: formData.slot_duration,
        sportIds: formData.sports.map(sport => sport.id),
      };

      const response = await apiClient.post(`/fields`, payload, {
        headers: { 'c-api-key': apiKey },
      });

      const id = response.data.id;
      navigate(`/fields/${id}/schedule`, { state: { source: 'new' } });
    } catch (error) {
      console.error('❌ Error al crear la cancha:', error);
      setError('No se pudo crear la cancha. Verifica los datos e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setHasChanges(true);
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedSport = sports.find(s => s.id === selectedId);

    if (selectedSport && !formData.sports.some(s => s.id === selectedId)) {
      setFormData(prev => ({
        ...prev,
        sports: [...prev.sports, selectedSport],
      }));
      setHasChanges(true);
    }
  };

  const handleRemoveSport = (id: number) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.filter(sport => sport.id !== id),
    }));
    setHasChanges(true);
  };

  const handleBack = () => {
    if (!hasChanges || window.confirm('¿Está seguro que desea volver? Los cambios no guardados se perderán.')) {
      navigate('/fields');
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 flex justify-center">
        <div className="max-w-3xl w-full">
          <div className="mb-6">
            <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center text-[#000066] hover:text-[#000088]"
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Volver
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h1 className="text-2xl font-bold text-[#000066] mb-6">Nueva Cancha</h1>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <InputField label="Nombre:" name="name" value={formData.name} onChange={handleInputChange} error={formErrors.name} />
              <InputField label="Descripción:" name="description" value={formData.description} onChange={handleInputChange} error={formErrors.description} />

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
                  {formData.sports.map(sport => (
                      <div key={sport.id} className="flex justify-between items-center bg-blue-100 text-blue-800 p-2 rounded-lg">
                        <span>{sport.name}</span>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRemoveSport(sport.id)}>
                          Eliminar
                        </Button>
                      </div>
                  ))}
                </div>
                {formErrors.sports && <p className="text-red-600 text-sm">{formErrors.sports}</p>}
              </div>

              <InputField 
                label="Costo por turno:" 
                name="cost" 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.cost} 
                onChange={handleInputChange} 
                error={formErrors.cost} 
                title="El valor debe ser mayor o igual a 0"
              />
              <InputField 
                label="Capacidad:" 
                name="capacity" 
                type="number" 
                min="1" 
                max="30" 
                value={formData.capacity} 
                onChange={handleInputChange} 
                error={formErrors.capacity} 
                title="El valor debe estar entre 1 y 30"
              />
              
              <div>
                <label className="block font-medium text-gray-700 mb-1">Duración del turno (en minutos):</label>
                <Select 
                  name="slot_duration" 
                  value={formData.slot_duration} 
                  onChange={handleInputChange} 
                  className="w-full"
                >
                  <option value="">Seleccione duración</option>
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                  <option value="120">120 minutos</option>
                </Select>
                {formErrors.slot_duration && <p className="text-red-600 text-sm mt-1">{formErrors.slot_duration}</p>}
              </div>

              {error && <div className="text-red-600 mt-4 text-center">{error}</div>}

              <div className="flex justify-center mt-6">
                <Button type="submit" className="bg-[#000066] hover:bg-[#000088]" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Asignar horarios"}
                </Button>
              </div>
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

const InputField: React.FC<InputFieldProps> = ({ label, error, ...props }) => {
  // Set custom validation message in Spanish
  const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    if (e.target.validity.rangeUnderflow) {
      e.target.setCustomValidity(`El valor debe ser mayor o igual a ${e.target.min}`);
    } else if (e.target.validity.rangeOverflow) {
      e.target.setCustomValidity(`El valor debe ser menor o igual a ${e.target.max}`);
    } else if (e.target.validity.valueMissing) {
      e.target.setCustomValidity("Este campo es obligatorio");
    } else {
      e.target.setCustomValidity("");
    }
  };

  // Reset custom validity when input changes
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity("");
  };

  return (
    <div>
      <label className="block font-medium text-gray-700 mb-1">{label}</label>
      <Input 
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-300" 
        onInvalid={handleInvalid}
        onInput={handleInput}
        {...props} 
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};