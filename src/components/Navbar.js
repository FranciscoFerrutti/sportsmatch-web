import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li>Inicio</li>
        <li>Mis canchas</li>
        <li>Reservas</li>
      </ul>
      <div className="user-section">
        <button>Cerrar sesión</button>
      </div>
    </nav>
  );
};

export default Navbar;
