import React from 'react';
import Navbar from '../components/Navbar';
import './Canchas.css';
import '../components/CommonStyles.css';


const Canchas = () => {
  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Mis canchas</h1>
        <div className="mis-canchas">
          <div className="tarjeta">
            <h3>Cancha 1</h3>
            <p>Tenis</p>
            <p>Ladrillo - Descubierta</p>
            <p>Lunes - Viernes: 09:00 - 22:00</p>
            <button>Modificar</button>
          </div>
          <div className="tarjeta">
            <h3>Cancha 2</h3>
            <p>Tenis</p>
            <p>Ladrillo - Descubierta</p>
            <p>Lunes - Viernes: 09:00 - 22:00</p>
            <button>Modificar</button>
          </div>
        </div>
        <button className="nueva-cancha">Nueva cancha</button>
      </div>
    </div>
  );
};

export default Canchas;
