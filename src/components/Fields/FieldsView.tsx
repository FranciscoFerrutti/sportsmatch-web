import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#000066]">Mis canchas</h1>
          <Button className="bg-[#000066] hover:bg-[#000088] text-white px-6 py-2 rounded-lg shadow-md" onClick={handleNewField}>
            + Nueva Cancha
          </Button>
        </div>

        {loading ? (
            <p className="text-center text-gray-500">Cargando canchas...</p>
        ) : fields.length === 0 ? (
            <p className="text-center text-gray-500">No hay canchas registradas.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields.map(field => (
                  <Card key={field.id} className="p-4 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 rounded-xl bg-white">
                    <CardHeader>
                      <CardTitle>{field.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      <p className="text-gray-600"><strong>Descripción:</strong> {field.description}</p>
                      <p className="text-gray-600">
                        <strong>Deportes permitidos:</strong> {field.sports.length > 0
                          ? field.sports.map(s => s.name).join(', ')
                          : 'No especificado'}
                      </p>
                      <p className="text-gray-600"><strong>Costo por reserva:</strong> ${field.cost}</p>
                      <p className="text-gray-600"><strong>Capacidad:</strong> {field.capacity} personas</p>
                      <p className="text-gray-600"><strong>Duración:</strong> {field.slot_duration} minutos</p>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/fields/${field.id}/edit`)}>
                        Modificar
                      </Button>
                      <Button className="bg-red-500 text-white hover:bg-red-600" onClick={() => handleDeleteField(field.id)}>
                        Eliminar
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
        )}
      </div>
  );
};
