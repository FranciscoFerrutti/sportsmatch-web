import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AppContext';
import { Search, LogOut } from 'lucide-react'; // Importamos los iconos necesarios

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
        <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center rounded-b-2xl">
            {/* Logo y Búsqueda */}
            <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-[#000066]">SportsMatch</h1>

                {/* Input de búsqueda con icono */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="border px-4 py-2 rounded-lg focus:ring focus:ring-blue-300"
                    />
                    <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
                </div>

                {/* Navegación */}
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              text-gray-700 hover:text-[#000066] transition-colors duration-200
              ${isActive ? 'font-semibold border-b-2 border-[#000066] pb-1' : 'pb-1 border-b-2 border-transparent'}
            `}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </div>

            {/* Botón de Logout con icono */}
            <button className="text-gray-700 hover:text-red-500 transition-colors duration-200 flex items-center"
                    onClick={handleLogout}>
                <LogOut className="mr-2 w-5 h-5" /> Cerrar sesión
            </button>
        </nav>
    );
};
