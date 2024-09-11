import React from 'react';
import Navbar from '../components/Navbar';
import './Reservas.css';
import '../components/CommonStyles.css';


const Reservas = () => {
  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Reservas</h1>
        <h2>Reservas pendientes de aprobación</h2>
        <div className="reservas-pendientes">
          <div className="tarjeta">
            <h3>Cancha 6</h3>
            <p>01 de Diciembre 2024</p>
            <p>17:30hs - 60 MIN</p>
            <button className="aceptar">Aceptar</button>
            <button className="rechazar">Rechazar</button>
          </div>
        </div>

        <h2>Próximas reservas</h2>
        <div className="proximas-reservas">
          <div className="tarjeta">
            <h3>Cancha 3</h3>
            <p>27 de Noviembre 2024</p>
            <p>11:30hs - 60 MIN</p>
            <button className="pendiente">Pendiente de pago</button>
          </div>
        </div>

        <h2>Reservas pasadas</h2>
        <div className="reservas-pasadas">
          <div className="tarjeta">
            <h3>Cancha 4</h3>
            <p>10 de Noviembre 2024</p>
            <p>15:30hs - 60 MIN</p>
            <button className="vencida">Vencida</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservas;
