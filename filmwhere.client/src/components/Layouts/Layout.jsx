import { Link, } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Home, Search, LogIn } from 'lucide-react';
import { useState } from 'react';

const AuthLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { name: 'Inicio', icon: <Home size={20} />, path: '/inicio-publico' },
        { name: 'Buscar', icon: <Search size={20} />, path: '/buscar-publico' },
        { name: 'Iniciar Sesion', icon: <LogIn size={20} />, path: '/login' }
    ];

    const primaryBgClass = theme === 'dark' ? 'bg-primario-dark' : 'bg-primario';
    const secondaryBgClass = theme === 'dark' ? 'bg-secundario-dark' : 'bg-secundario';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const navbarBgClass = theme === 'dark' ? 'bg-black/80' : 'bg-white/80';
    const navbarTextClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const activeClass = theme === 'dark' ? 'bg-primario text-texto' : 'bg-primario-dark text-texto-dark';
    const hoverClass = theme === 'dark'
        ? 'hover:bg-primario hover:text-texto'
        : 'hover:bg-primario-dark hover:text-texto-dark';

    return (
        <div className="flex min-h-screen flex-col">
            {/* Top navigation */}
            <header className={`${navbarBgClass} backdrop-blur-lg fixed top-0 w-full z-50 shadow-md`}>
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <span className={`text-2xl font-extrabold ${navbarTextClass}`}>FilmWhere</span>
                        </Link>

                        {/* Desktop navigation */}
                        <div className="hidden items-center space-x-4 md:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`${navbarTextClass} ${hoverClass} px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`${navbarTextClass} p-2 rounded-full ${hoverClass} transition-colors`}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
                    <div className={`md:hidden ${navbarBgClass} backdrop-blur-lg shadow-lg`}>
                        <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`${navbarTextClass} ${hoverClass} block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            <button
                                onClick={toggleTheme}
                                className={`${navbarTextClass} ${hoverClass} w-full block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2`}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                                <span>Cambiar tema</span>
                            </button>

                        </div>
                    </div>
                )}
            </header>

            {/* Content with padding for navbar */}
            <main className="flex-grow pt-16">
                {children}
            </main>

            {/* Footer - Optional */}
            <footer className={`${navbarBgClass} backdrop-blur-lg py-4 mt-6 shadow-inner`}>
                <div className="container mx-auto px-4 text-center">
                    <p className={`${navbarTextClass} text-sm`}>© {new Date().getFullYear()} FilmWhere - Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    );
};

export default AuthLayout;