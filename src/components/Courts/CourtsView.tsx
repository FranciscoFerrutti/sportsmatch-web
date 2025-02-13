import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import { Court } from '@/types/courts';
import { useAuth } from '@/context/AppContext';

export const CourtsView = () => {
  const navigate = useNavigate();
  const { clubId } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const apiKey = localStorage.getItem('c-api-key');

  useEffect(() => {
    if (!clubId) {
      console.warn("⚠️ No hay clubId disponible, no se pueden obtener las canchas.");
      setLoading(false);
      return;
    }

    const fetchCourts = async () => {
      try {
        const response = await apiClient.get(`/fields/${clubId}`, {
          headers: { 'c-api-key': apiKey },
        });

        const formattedCourts: Court[] = response.data.map((court: any) => ({
          id: court.id,
          name: court.name,
          description: court.description,
          cost: court.cost || 0,
          capacity: court.capacity || 0,
          slot_duration: court.slot_duration || 0,
          sports: Array.isArray(court.sports) && court.sports.length > 0
              ? court.sports.map((s: any) => ({ id: s.id, name: s.name }))
              : []
        }));

        setCourts(formattedCourts);
      } catch (error) {
        console.error("❌ Error al obtener las canchas:", error);
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, [clubId]);

  const handleNewCourt = () => {
    navigate('/courts/new');
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (!clubId) {
      console.error("❌ No hay clubId disponible para eliminar la cancha.");
      return;
    }

    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta cancha?");
    if (!confirmDelete) return;

    try {
      await apiClient.delete(`/fields/${clubId}/${courtId}`, {
        headers: { 'c-api-key': apiKey },
      });

      setCourts(prevCourts => prevCourts.filter(court => court.id !== courtId));
    } catch (error) {
      console.error("❌ Error al eliminar la cancha:", error);
    }
  };

  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Mis canchas</h1>
          <Button className="bg-[#000066] hover:bg-[#000088]" onClick={handleNewCourt}>
            Nueva cancha
          </Button>
        </div>

        {loading ? (
            <p className="text-center text-gray-500">Cargando canchas...</p>
        ) : courts.length === 0 ? (
            <p className="text-center text-gray-500">No hay canchas registradas.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courts.map(court => (
                  <Card key={court.id} className="p-4 bg-white">
                    <h3 className="font-semibold text-lg mb-2">{court.name}</h3>
                    <p className="text-gray-600 mb-4">Descripción: {court.description}</p>
                    <p className="text-gray-600 mb-4">
                      Deportes permitidos: {court.sports?.length > 0
                        ? court.sports.map(s => s.name).join(', ')
                        : 'No especificado'}
                    </p>
                    <p className="text-gray-600 mb-4">Costo: ${court.cost}</p>
                    <p className="text-gray-600 mb-4">Capacidad: {court.capacity} personas</p>
                    <p className="text-gray-600 mb-4">Duración de franja: {court.slot_duration} minutos</p>

                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1" onClick={() => navigate(`/courts/${court.id}/edit`)}>
                        Modificar
                      </Button>
                      <Button
                          variant="destructive"
                          className="flex-1 text-white bg-red-600 hover:bg-red-700"
                          onClick={() => handleDeleteCourt(court.id)}
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
