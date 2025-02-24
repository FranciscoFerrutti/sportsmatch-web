import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import { Field } from '@/types/fields';
import { useAuth } from '@/context/AppContext';

export const FieldsView = () => {
  const navigate = useNavigate();
  const { clubId } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const apiKey = localStorage.getItem('c-api-key');

  useEffect(() => {
    if (!clubId) {
      console.warn("⚠️ No hay clubId disponible, no se pueden obtener las canchas.");
      setLoading(false);
      return;
    }

    const fetchFields = async () => {
      try {
        const response = await apiClient.get(`/fields`, {
          headers: { 'c-api-key': apiKey },
          params: { clubId }
        });

        const formattedFields: Field[] = response.data.map((field: any) => ({
          id: field.id,
          name: field.name,
          description: field.description,
          cost: field.cost || 0,
          capacity: field.capacity || 0,
          slot_duration: field.slot_duration || 0,
          sports: Array.isArray(field.sports) && field.sports.length > 0
              ? field.sports.map((s: any) => ({ id: s.id, name: s.name }))
              : []
        }));

        setFields(formattedFields);
      } catch (error) {
        console.error("❌ Error al obtener las canchas:", error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [clubId]);

  const handleNewField = () => {
    navigate('/fields/new');
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!clubId) {
      console.error("❌ No hay clubId disponible para eliminar la cancha.");
      return;
    }

    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta cancha?");
    if (!confirmDelete) return;

    try {
      await apiClient.delete(`/fields/${fieldId}`, {
        headers: { 'c-api-key': apiKey },
        params: { clubId }
      });

      setFields(prevFields => prevFields.filter(field => field.id !== fieldId));
    } catch (error) {
      console.error("❌ Error al eliminar la cancha:", error);
    }
  };

  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Mis canchas</h1>
          <Button className="bg-[#000066] hover:bg-[#000088]" onClick={handleNewField}>
            Nueva cancha
          </Button>
        </div>

        {loading ? (
            <p className="text-center text-gray-500">Cargando canchas...</p>
        ) : fields.length === 0 ? (
            <p className="text-center text-gray-500">No hay canchas registradas.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fields.map(field => (
                  <Card key={field.id} className="p-4 bg-white">
                    <h3 className="font-semibold text-lg mb-2">{field.name}</h3>
                    <p className="text-gray-600 mb-4">Descripción: {field.description}</p>
                    <p className="text-gray-600 mb-4">
                      Deportes permitidos: {field.sports?.length > 0
                        ? field.sports.map(s => s.name).join(', ')
                        : 'No especificado'}
                    </p>
                    <p className="text-gray-600 mb-4">Costo por reserva: ${field.cost}</p>
                    <p className="text-gray-600 mb-4">Capacidad: {field.capacity} personas</p>
                    <p className="text-gray-600 mb-4">Duración de reserva: {field.slot_duration} minutos</p>

                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1" onClick={() => navigate(`/fields/${field.id}/edit`)}>
                        Modificar
                      </Button>
                      <Button
                          variant="destructive"
                          className="flex-1 text-white bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteField(field.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </Card>
              ))}
            </div>
        )}
      </div>
  );
};
