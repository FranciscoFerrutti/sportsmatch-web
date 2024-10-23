// src/components/Navigation.tsx
import React from 'react';
import { View } from '../types/navigation';

export interface NavigationProps {
  onViewChange: (view: View) => void;
  currentView: View;
}

export const Navigation: React.FC<NavigationProps> = ({ onViewChange, currentView }) => {
  const navItems: { view: View; label: string }[] = [
    { view: 'inicio', label: 'Inicio' },
    { view: 'mis-canchas', label: 'Mis canchas' },
    { view: 'reservas', label: 'Reservas' },
    { view: 'calendario', label: 'Calendario' }
  ];

  return (
    <nav className="bg-[#000066] p-4 flex justify-between items-center text-white">
      <div className="flex space-x-4">
        {navItems.map(item => (
          <a
            key={item.view}
            href="#"
            className={`hover:text-gray-300 ${currentView === item.view ? 'font-semibold' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onViewChange(item.view);
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
      <button className="text-white hover:text-gray-300">
        Cerrar sesión
      </button>
    </nav>
  );
};