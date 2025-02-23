import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AppContext';

export const Navigation = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  const navItems = [
    { path: '/home', label: 'Inicio' },
    { path: '/fields', label: 'Mis canchas' },
    { path: '/reservations', label: 'Reservas' },
    { path: '/calendar', label: 'Calendario' }
  ];

  return (
    <nav className="bg-[#000066] px-6 py-4 flex justify-between items-center text-white shadow-md">
      <div className="flex items-center space-x-6">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              text-white hover:text-gray-200 transition-colors duration-200
              ${isActive ? 'font-semibold border-b-2 border-white pb-1' : 'pb-1 border-b-2 border-transparent'}
            `}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <button className="text-white hover:text-gray-200 transition-colors duration-200" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </nav>
  );
};