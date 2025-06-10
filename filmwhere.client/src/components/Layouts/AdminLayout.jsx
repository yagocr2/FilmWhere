import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    Sun,
    Moon,
    UserCircle,
    LogOut,
    Users,
    BarChart3,
    Shield,
    Settings,
    Home,
    Crown,
    Search,
    User
} from 'lucide-react';
import { useState } from 'react';

const AdminLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { name: 'Dashboard', icon: <BarChart3 size={20} />, path: '/admin' },
        { name: 'Usuarios', icon: <Users size={20} />, path: '/admin/usuarios' },
        { name: 'Roles', icon: <Shield size={20} />, path: '/admin/roles' },
    ];

    const userNavItems = [
        { name: 'Buscar', icon: <Search size={20} />, path: '/buscar' },
        { name: 'Perfil', icon: <User size={20} />, path: '/perfil' },
    ];

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    const primaryBgClass = theme === 'dark' ? 'bg-primario-dark' : 'bg-primario';
    const secondaryBgClass = theme === 'dark' ? 'bg-secundario-dark' : 'bg-secundario';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const navbarBgClass = theme === 'dark' ? 'bg-red-900/90' : 'bg-red-700/90';
    const navbarTextClass = 'text-white';
    const activeClass = 'bg-red-800 text-white';
    const hoverClass = 'hover:bg-red-800 hover:text-white';

    return (
        <div className="flex min-h-screen flex-col">
            {/* Top navigation */}
            <header className={`${navbarBgClass} backdrop-blur-lg fixed top-0 w-full z-50 shadow-lg border-b border-red-600`}>
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link to="/admin" className="flex items-center space-x-2">
                            <Crown className="text-yellow-400" size={28} />
                            <span className={`text-2xl font-extrabold ${navbarTextClass}`}>
                                FilmWhere Admin
                            </span>
                        </Link>

                        {/* Desktop navigation */}
                        <div className="hidden items-center space-x-4 md:flex">
                            {/* Admin navigation */}
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`${navbarTextClass} ${isActiveRoute(item.path) ? activeClass : hoverClass
                                        } px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {/* Separador */}
                            <div className="mx-2 h-6 border-l border-red-600"></div>

                            {/* User navigation */}
                            {userNavItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`${navbarTextClass} ${isActiveRoute(item.path) ? activeClass : hoverClass
                                        } px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {/* Separador */}
                            <div className="mx-2 h-6 border-l border-red-600"></div>

                            {/* Volver a la aplicación */}
                            <Link
                                to="/inicio"
                                className={`${navbarTextClass} ${hoverClass} px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors`}
                            >
                                <Home size={20} />
                                <span>Ver App</span>
                            </Link>

                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`${navbarTextClass} p-2 rounded-full ${hoverClass} transition-colors`}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* User info */}
                            <div className="flex items-center space-x-2 rounded-md bg-red-800 px-3 py-1">
                                <UserCircle size={20} className="text-yellow-400" />
                                <span className="text-sm font-medium">{user?.nombre || 'Admin'}</span>
                            </div>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className={`${navbarTextClass} ${hoverClass} px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors`}
                            >
                                <LogOut size={20} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`${navbarTextClass} p-2 rounded-md`}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className={`md:hidden ${navbarBgClass} backdrop-blur-lg shadow-lg border-t border-red-600`}>
                        <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                            {/* Admin navigation mobile */}
                            <div className="mb-3">
                                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-red-300">
                                    Administración
                                </p>
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`${navbarTextClass} ${isActiveRoute(item.path) ? activeClass : hoverClass
                                            } block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* User navigation mobile */}
                            <div className="mb-3">
                                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-red-300">
                                    Usuario
                                </p>
                                {userNavItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`${navbarTextClass} ${isActiveRoute(item.path) ? activeClass : hoverClass
                                            } block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 transition-colors`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Other options mobile */}
                            <div className="border-t border-red-600 pt-3">
                                <Link
                                    to="/inicio"
                                    className={`${navbarTextClass} ${hoverClass} block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Home size={20} />
                                    <span>Ver App</span>
                                </Link>

                                <button
                                    onClick={toggleTheme}
                                    className={`${navbarTextClass} ${hoverClass} w-full block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2`}
                                >
                                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                    <span>Cambiar tema</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className={`${navbarTextClass} ${hoverClass} w-full block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2`}
                                >
                                    <LogOut size={20} />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Content with padding for navbar */}
            <main className={`flex-grow pt-16 ${theme === 'dark' ? 'bg-primario-dark' : 'bg-primario'} min-h-screen`}>
                <div className="container mx-auto px-4 py-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className={`${navbarBgClass} backdrop-blur-lg py-4 shadow-inner border-t border-red-600`}>
                <div className="container mx-auto px-4 text-center">
                    <p className={`${navbarTextClass} text-sm`}>
                        © {new Date().getFullYear()} FilmWhere Admin Panel - Panel de Administración
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AdminLayout;