import { useNavigate } from 'react-router-dom';

export const NavigationLanding = () => {
    const navigate = useNavigate();

    return (
        <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center rounded-b-2xl relative">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
                <img
                    src="https://new-sportsmatch-user-pictures-2025.s3.us-east-1.amazonaws.com/logo.png"
                    alt="SportsMatch Logo"
                    className="h-10 w-10 object-cover rounded-md"
                />
                <h1 className="text-2xl font-bold text-[#000066]">SportsMatch+</h1>
            </div>

            {/* Club Button */}
            <button
                className="bg-white text-[#000066] px-6 py-2 rounded-full border border-[#000066] hover:bg-[#DADAEC] transition-colors duration-200"
                onClick={() => navigate('/login')}
            >
                Soy un club
            </button>
        </nav>
    );
};