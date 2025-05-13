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
            <header className="fixed top-0 left-0 right-0 z-50 pt-1 pb-1 px-4 flex justify-between items-center">
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
                        <div className="p-2 bg-indigo-800/80 dark:bg-black/80 rounded-full hover:bg-indigo-800/50 dark:hover:bg-yellow-600/80 transition-colors duration-300">

                        <ShinyText
                            text="Login"
                            colors={theme === 'dark' ? ["#ccfc00", "#1e00af"] : ["#1e00af", "#ccfc00"]}
                            velocity={0.8}
                            fontSize="1.1rem"
                            />
                        </div>
                    </Link>
                    <Link to="/register">
                    <div className="p-2 bg-black/30 dark:bg-black/80 rounded-full hover:bg-indigo-800/50 dark:hover:bg-yellow-600/80 transition-colors duration-300">
                        <ShinyText
                            text="Register"
                            colors={theme === 'dark' ? ["#1e00af", "#ccfc00"] : ["#ccfc00", "#1e00af"]}
                            velocity={0.8}
                            fontSize="1.1rem"
                        />
                        </div>

                    </Link>
                    {/* Botón tema */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-gray-200 dark:bg-yellow-200 rounded-full hover:bg-black dark:hover:bg-yellow-50 transition-colors duration-300"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="h-8 w-8 text-yellow-600" />
                        ) : (
                            <MoonIcon className="h-8 w-8 text-purple-600 " />
                        )}
                    </button>
                </div>
            </header>

            {/* Contenido principal */}
            <main>{children}</main>
        </div>
    );
};