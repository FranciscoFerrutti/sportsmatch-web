// src/components/Navigation.tsx
import React from 'react';
import { View } from '@/types/navigation';

export interface NavigationProps {
  onViewChange: (view: View) => void;
  currentView: View;
}

export const Navigation: React.FC<NavigationProps> = ({ onViewChange, currentView }) => {
  const navItems: Array<{ view: View; label: string }> = [
    { view: 'inicio', label: 'Inicio' },
    { view: 'mis-canchas', label: 'Mis canchas' },
    { view: 'reservas', label: 'Reservas' },
    { view: 'calendario', label: 'Calendario' }
  ];

  const isFormView = (view: View) => 
    view === 'nueva-cancha' || view === 'modificar-cancha';

  return (
    <nav className="bg-[#000066] px-6 py-4 flex justify-between items-center text-white shadow-md">
      <div className="flex items-center space-x-6">
        {navItems.map(item => (
          <a
            key={item.view}
            href="#"
            className={`
              text-white hover:text-gray-200 transition-colors duration-200
              ${currentView === item.view ? 'font-semibold border-b-2 border-white pb-1' : 'pb-1 border-b-2 border-transparent'}
              ${isFormView(currentView) && item.view === 'mis-canchas' ? 'font-semibold' : ''}
            `}
            onClick={(e) => {
              e.preventDefault();
              onViewChange(item.view);
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
      
      <button 
        className="text-white hover:text-gray-200 transition-colors duration-200 px-4 py-2 rounded-md hover:bg-[#000088]"
        onClick={() => {
          // Here you would typically handle logout
          console.log('Logout clicked');
        }}
      >
        Cerrar sesión
      </button>
    </nav>
  );
};