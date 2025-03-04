import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AppContext';
import { LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '@/apiClients';

export const Navigation = () => {
    const { clubId, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        setMenuOpen(false);
        navigate('/club-profile');
    };

    const navItems = [
        { path: '/home', label: 'Inicio' },
        { path: '/fields', label: 'Mis canchas' },
        { path: '/reservations', label: 'Reservas' },
        { path: '/calendar', label: 'Calendario' }
    ];

    // 🔹 Cierra el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as HTMLElement).closest("#user-menu")) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [menuOpen]);

    // 📌 Obtener la imagen del perfil del club
    useEffect(() => {
        if (!clubId) return;

        const fetchProfileImage = async () => {
            try {
                const response = await apiClient.get(`/clubs`, {
                    params: { clubId }
                });

                if (response.data.image_url) {
                    setProfileImage(response.data.image_url);
                }
            } catch (error) {
                console.error("❌ Error al obtener la imagen de perfil:", error);
            }
        };

        fetchProfileImage();
    }, [clubId]);

    return (
        <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center rounded-b-2xl relative">
            {/* Logo y Navegación */}
            <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-[#000066]">SportsMatch</h1>

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

            {/* Menú de usuario */}
            <div className="relative" id="user-menu">
                <button
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#000066] transition-colors duration-200"
                    onClick={() => setMenuOpen(prev => !prev)}
                >
                    {/* 🔹 Imagen de perfil con fallback al ícono */}
                    {!imageError && profileImage ? (
                        <img
                            src={profileImage}
                            alt="Perfil"
                            className="w-8 h-8 rounded-full object-cover border"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <UserCircle className="w-8 h-8 text-gray-600" />
                    )}

                    <ChevronDown className="w-5 h-5 text-gray-500" />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                        <button
                            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={handleProfileClick}
                        >
                            Mi perfil
                        </button>
                        <button
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5 mr-2" /> Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};
