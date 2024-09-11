import React from 'react';
import Navbar from '../components/Navbar';
import './Home.css';
import '../components/CommonStyles.css';


const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Inicio</h1>
        <h2>Reservas pendientes de aprobación</h2>
        <div className="reservas-pendientes">
          <div className="tarjeta">
            <h3>Cancha 6</h3>
            <p>01 de Diciembre 2024</p>
            <p>17:30hs - 60 MIN</p>
            <button className="aceptar">Aceptar</button>
            <button className="rechazar">Rechazar</button>
          </div>
          <div className="tarjeta">
            <h3>Cancha 1</h3>
            <p>03 de Diciembre 2024</p>
            <p>17:45hs - 60 MIN</p>
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
          <div className="tarjeta">
            <h3>Cancha 1</h3>
            <p>01 de Diciembre 2024</p>
            <p>13:45hs - 60 MIN</p>
            <button className="señada">Señada</button>
          </div>
          <div className="tarjeta">
            <h3>Cancha 2</h3>
            <p>24 de Noviembre 2024</p>
            <p>20:00hs - 60 MIN</p>
            <button className="pagada">Pagada</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
