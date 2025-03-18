import { Mail } from 'lucide-react';

export const TermsAndConditionsView = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-[#000066] mb-8">Términos y Condiciones</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Modelo de Negocio</h2>
                <div className="prose max-w-none">
                    <p className="text-gray-700">
                        SportsMatch es una plataforma que conecta a clubes deportivos con jugadores y equipos que buscan reservar canchas para sus actividades. 
                        Nuestro modelo de negocio se basa en proporcionar a los clubes deportivos una herramienta eficiente para gestionar sus instalaciones, 
                        mientras que ofrecemos a los usuarios finales una forma sencilla de encontrar y reservar espacios deportivos.
                    </p>
                    <p className="text-gray-700 mt-3">
                        Los clubes deportivos que se registran en nuestra plataforma pueden listar sus canchas, establecer horarios de disponibilidad, 
                        gestionar reservas y recibir pagos directamente a través de nuestro sistema. A cambio, SportsMatch cobra una comisión del 2.5% 
                        sobre cada reserva completada a través de la plataforma.
                    </p>
                    <p className="text-gray-700 mt-3">
                        Nos comprometemos a proporcionar un servicio de alta calidad, con soporte técnico disponible para todos nuestros usuarios y 
                        actualizaciones regulares de la plataforma para mejorar la experiencia tanto de los clubes como de los jugadores.
                    </p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Política de Horarios</h2>
                <div className="prose max-w-none">
                    <p className="text-gray-700">
                        Los clubes deportivos son responsables de mantener actualizada la disponibilidad de sus canchas en la plataforma. 
                        La carga de horarios se realiza a través del panel de administración, donde los clubes pueden:
                    </p>
                    <ul className="list-disc pl-6 mt-2 text-gray-700">
                        <li className="mt-1">Establecer horarios regulares de apertura y cierre para cada cancha</li>
                        <li className="mt-1">Definir bloques de tiempo específicos para reservas (por ejemplo, bloques de 1 hora, 1.5 horas, etc.)</li>
                        <li className="mt-1">Bloquear fechas u horarios específicos para mantenimiento o eventos privados desde la vista de Calendario</li>
                    </ul>
                    <p className="text-gray-700 mt-3">
                        Los cambios de horarios en lotes se actualizan para dentro de 14 días para no afectar las reservas ya confirmadas. Es responsabilidad del club
                        actualizar los horarios de forma manual en la plataforma cada 1 mes. De igual manera el 15 de cada mes recibirá un correo informativo para que pueda actualizar los horarios.
                    </p>
                    <p className="text-gray-700 mt-3">
                        En caso que se este acercando la fecha de la reserva y no se haya efectuado el pago de la misma, el club debe notificar al usuario para que pueda cancelar la reserva. 
                        Dentro de la información de la reserva figura el contacto del usuario para que el club pueda notificarle.
                    </p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Términos de Reserva</h2>
                <div className="prose max-w-none">
                    <p className="text-gray-700">
                        Al utilizar nuestra plataforma para gestionar reservas, los clubes deportivos aceptan los siguientes términos:
                    </p>
                    <ol className="list-decimal pl-6 mt-2 text-gray-700">
                        <li className="mt-2">
                            <strong>Confirmación de reservas:</strong> Todas las reservas realizadas a través de la plataforma se consideran confirmadas 
                            una vez que el pago ha sido procesado. El club recibirá una notificación y deberá garantizar la disponibilidad de la cancha 
                            en el horario reservado.
                        </li>
                        <li className="mt-2">
                            <strong>Cancelaciones por parte del usuario:</strong> Los usuarios pueden cancelar sus reservas según la política de cancelación 
                            establecida por la aplicación:
                            <ul className="list-disc pl-6 mt-1 text-gray-700">
                                <li>Cancelación con más de 24 horas de anticipación: reembolso del 100%</li>
                                <li>Cancelación con menos de 24 horas de anticipación: sin reembolso</li>
                            </ul>
                        </li>
                        <li className="mt-2">
                            <strong>Cancelaciones por parte del club:</strong> Si un club necesita cancelar una reserva con el pago efectuado 
                            el usuario recibirá un reembolso completo. SportsMatch se reserva el derecho de aplicar penalizaciones a los clubes 
                            que cancelen reservas confirmadas de forma recurrente sin justificación adecuada.
                        </li>
                        <li className="mt-2">
                            <strong>Pagos:</strong> Los pagos se procesan a través de la plataforma SportsMatch cobrando un 50% del valor de la reserva. El importe, menos la comisión de SportsMatch, 
                            se transferirá a la cuenta bancaria del club en un plazo de 3-5 días hábiles después de la fecha de la reserva.
                        </li>
                        <li className="mt-2">
                            <strong>Disputas:</strong> En caso de disputa entre un club y un usuario, SportsMatch actuará como mediador para encontrar una 
                            solución justa. La decisión final de SportsMatch será vinculante para ambas partes.
                        </li>
                    </ol>
                    <p className="text-gray-700 mt-3">
                        SportsMatch se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor 
                        inmediatamente después de su publicación en la plataforma, y se notificará a todos los usuarios registrados.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contáctanos</h2>
                <div className="prose max-w-none">
                    <p className="text-gray-700">
                        Si tienes alguna pregunta, comentario o necesitas asistencia relacionada con estos términos y condiciones, 
                        no dudes en contactarnos a través de nuestro correo electrónico:
                    </p>
                    <div className="flex items-center mt-4 bg-blue-50 p-4 rounded-lg">
                        <Mail className="text-[#000066] w-6 h-6 mr-3" />
                        <a 
                            href="mailto:sportsmatch010@gmail.com" 
                            className="text-[#000066] font-medium hover:underline"
                        >
                            sportsmatch010@gmail.com
                        </a>
                    </div>
                    <p className="text-gray-700 mt-4">
                        Nuestro equipo de soporte estará encantado de ayudarte y responderá a tu consulta lo antes posible.
                    </p>
                </div>
            </div>
        </div>
    );
}; 