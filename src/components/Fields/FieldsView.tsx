import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import apiClient from '@/apiClients';
import { Field } from '@/types/fields';
import { useAuth } from '@/context/AppContext';
import styles from './Fields.module.css';

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
      <div className={styles.fieldsContainer}>
        <div className={styles.pageHeader}>
          <h1 className="text-2xl font-bold text-[#000066] mb-8">Mis canchas</h1>
          <button
              className={styles.createButton}
              onClick={handleNewField}
          >
            + Nueva Cancha
          </button>
        </div>

        {loading ? (
            <div className={styles.loadingSpinner}>
              <p className={styles.loadingText}>Cargando canchas</p>
            </div>
        ) : fields.length === 0 ? (
            <div className={styles.emptyState}>No hay canchas registradas.</div>
        ) : (
            <div className={styles.fieldsGrid}>
              {fields.map(field => (
                  <div
                      key={field.id}
                      className={styles.fieldCard}
                  >
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{field.name}</h3>
                    </div>

                    <div className={styles.cardContent}>
                      <p className="text-gray-600"><strong>Descripción:</strong> {field.description}</p>
                      <p className="text-gray-600">
                        <strong>Deportes permitidos:</strong> {field.sports.length > 0
                          ? field.sports.map(s => s.name).join(', ')
                          : 'No especificado'}
                      </p>
                      <p className="text-gray-600"><strong>Costo por turno:</strong> ${field.cost}</p>
                      <p className="text-gray-600"><strong>Capacidad:</strong> {field.capacity} personas</p>
                      <p className="text-gray-600"><strong>Duración:</strong> {field.slot_duration} minutos</p>
                    </div>

                    <div className={styles.cardFooter}>
                      <Button
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={() => navigate(`/fields/${field.id}`)}
                      >
                        Ver detalles
                      </Button>
                      <Button
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleDeleteField(field.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
        )}
        <div className="text-center text-gray-400 text-sm mt-8 pb-4">
          Al ser usuario de la aplicación tenemos tu consentimiento sobre los <a href="/terms-and-conditions" className="underline hover:text-gray-600">términos y condiciones</a>
        </div>
      </div>
  );
};
