// components/Layout.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Crearemos este contexto
import ShinyText from "../TextAnimations/ShinyText/ShinyText";
import StarBorder from "../Animations/StarBorder/StarBorder";
import {SunIcon, MoonIcon} from "@heroicons/react/24/outline"

export default function Layout({ children }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className={theme === 'dark' ? 'dark' : ''}>
            {/* Header global */}
            <header className="fixed top-0 left-0 right-0 z-50 pt-1 pb-1 px-4 flex justify-between items-center backdrop-blur-md bg-black/30 ">
                {/* Logo a la izquierda */}
                <Link to="/" className="flex items-center space-x-3">

                    <img
                        src="/public/logo.png"
                        alt="Logo"
                        className="h-20 w-20 object-contain mix-blend-difference"
                    />
                    {/*<ShinyText*/}
                    {/*    text="FilmWhere"*/}
                    {/*    colors={theme === 'dark' ? ["#ccfc00", "#1e00af"] : ["#1e00af", "#ccfc00"]}*/}
                    {/*    velocity={0.8}*/}
                    {/*    fontSize="1.5rem"*/}
                    {/*/>*/}
                </Link>
                
                {/* Controles a la derecha */}
                <div className="flex items-center space-x-4">

                    {/* Botones de autenticación */}
                    <Link to="/login">
                        <ShinyText
                            text="Login"
                            colors={theme === 'dark' ? ["#ccfc00", "#1e00af"] : ["#1e00af", "#ccfc00"]}
                            velocity={0.8}
                            fontSize="1.1rem"
                        />
                    </Link>
                    <Link to="/register">
                        <ShinyText
                            text="Register"
                            colors={theme === 'dark' ? ["#1e00af", "#ccfc00"] : ["#ccfc00", "#1e00af"]}
                            velocity={0.8}
                            fontSize="1.1rem"
                        />
                    </Link>
                    {/* Botón tema */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-indigo-700/50 rounded-full transition-colors duration-300"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="h-7 w-7 text-yellow-400" />
                        ) : (
                            <MoonIcon className="h-7 w-7 text-gray-400" />
                        )}
                    </button>
                </div>
            </header>

            {/* Contenido principal */}
            <main>{children}</main>
        </div>
    );
};