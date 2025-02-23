import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field } from '@/types/fields';

type FieldCardProps = {
  field: Field;
  onModify: (id: number) => void;
};

export const FieldCard = ({ field, onModify }: FieldCardProps) => {
  const sportNames = field.sports.length > 0 ? field.sports.map(s => s.name).join(', ') : 'Sin deportes asignados';

  return (
      <Card className="p-4">
        <CardContent>
          <h3 className="font-bold mb-2">{field.name}</h3>
          <p className="text-gray-600">{field.description}</p>
          <p className="text-gray-600">Deportes: {sportNames}</p>
          <p className="text-gray-600">Costo: ${field.cost}</p>
          <p className="text-gray-600">Capacidad: {field.capacity} personas</p>
          <p className="text-gray-600">Duración de franja: {field.slot_duration} minutos</p>

          <div className="mt-4 space-y-1 text-sm">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                <p key={day} className="text-gray-500">
                  {day}: 08:00 - 21:00
                </p>
            ))}
          </div>

          <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => onModify(field.id)}
          >
            Modificar
          </Button>
        </CardContent>
      </Card>
  );
};
