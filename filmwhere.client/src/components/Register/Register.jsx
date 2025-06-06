// src/components/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LiquidChrome from '../../Backgrounds/LiquidChrome/LiquidChrome';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import ClickSpark from '../../Animations/ClickSpark/ClickSpark';
import ScrollVelocity from '../../TextAnimations/ScrollVelocity/ScrollVelocity';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';


const Register = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setErrors] = useState('');
    const [formData, setFormData] = useState({
        userName: '',
        nombre: '',
        apellidos: '',
        fechaNacimiento: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };
    const validateForm = () => {
        const newErrors = [];

        if (!formData.userName.trim() || formData.userName.length < 2) {
            newErrors.push('El nombre de usuario debe tener al menos 2 caracteres');
        }

        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.push('Por favor ingrese un correo electrónico válido');
        }

        if (!formData.password) {
            newErrors.push('Por favor ingrese una contraseña');
        } else if (formData.password.length < 6) {
            newErrors.push('La contraseña debe tener al menos 6 caracteres');
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.push('Las contraseñas no coinciden');
        }

        // Validar que la fecha de nacimiento no sea futura
        if (formData.fechaNacimiento && formData.fechaNacimiento > today) {
            newErrors.push('La fecha de nacimiento no puede ser futura');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar formulario antes de enviar
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors([]);

        try {
            const response = await fetch('/api/Auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userName: formData.userName,
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    email: formData.email,
                    fechaNacimiento: formData.fechaNacimiento,
                    password: formData.password
                })
        
            });

            const data = await response.json();
            if (!response.ok) {
                // Manejar errores específicos del servidor
                if (data.errors && Array.isArray(data.errors)) {
                    setErrors(data.errors);
                } else {
                    setErrors([data.message || 'Error al registrarse']);
                }
                return;
            }

            // Registro exitoso, redirigir a inicio de sesión
            navigate('/login', { state: { message: 'Registro exitoso. Ahora puedes iniciar sesión.' } });
        } catch (err) {
            console.log('Response status: ', err);
            setErrors(['Error de conexión. Por favor intente más tarde.']);
        } finally {
            setIsLoading(false);
        }
    };

    const primaryColorClass = theme === 'dark' ? 'bg-primario-dark' : 'bg-primario';
    const textColorClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';

    return (
        <div className="relative h-screen w-screen overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <LiquidChrome
                    baseColor={theme === 'dark' ? [0.05, 0.02, 0.15] : [0.9, 0.8, 1]}
                    amplitude={0.3}
                    speed={0.15}
                />
            </div>

            <FadeContent duration={1200} className="relative z-10 flex h-full w-full items-center justify-center">
                <div className={`w-full max-w-md rounded-2xl ${primaryColorClass} p-8 shadow-2xl backdrop-blur-lg`}>
                    <div className="div-titulo mb-6 text-center">
                        <ScrollVelocity
                            className="text-shadow text-texto text-4xl font-extrabold dark:text-texto-dark"
                            texts={['FilmWhere', 'Crear Cuenta']}
                            velocity={15}
                        />
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-500 bg-opacity-20 p-3 text-red-700 backdrop-blur-sm">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Sección de nombre y apellido con estructura corregida */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="nombre" className={`block text-sm font-medium ${textColorClass}`}>
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    minLength={2}
                                    maxLength={20}
                                    className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label htmlFor="apellidos" className={`block text-sm font-medium ${textColorClass}`}>
                                    Apellidos
                                </label>
                                <input
                                    type="text"
                                    id="apellidos"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    required
                                    minLength={2}
                                    maxLength={30}
                                    className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                    placeholder="Tus apellidos"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="fechaNacimiento" className={`block text-sm font-medium ${textColorClass}`}>
                                Fecha de nacimiento
                            </label>
                            <input
                                type="date"
                                id="fechaNacimiento"
                                name="fechaNacimiento"
                                value={formData.fechaNacimiento}
                                onChange={handleChange}
                                required
                                max={today}
                                className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="userName" className={`block text-sm font-medium ${textColorClass}`}>
                                Nombre de usuario
                            </label>
                            <input
                                type="text"
                                id="userName"
                                name="userName"
                                value={formData.userName}
                                onChange={handleChange}
                                required
                                minLength={2}
                                maxLength={20}
                                className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                placeholder="Nombre de usuario"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium ${textColorClass}`}>
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                placeholder="correo@ejemplo.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium ${textColorClass}`}>
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                    placeholder="Contraseña"
                                />
                                <button
                                    type="button"
                                    className="-translate-y-1/2 absolute right-3 top-1/2 transform"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <EyeOff className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                    ) : (
                                        <Eye className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${textColorClass}`}>
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                    placeholder="Confirmar contraseña"
                                />
                                <button
                                    type="button"
                                    className="-translate-y-1/2 absolute right-3 top-1/2 transform"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                    ) : (
                                        <Eye className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <ClickSpark sparkColor={theme === 'dark' ? "#fff" : "#333"}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full transform rounded-lg ${theme === 'dark' ? 'bg-primario text-texto' : 'bg-primario-dark text-texto-dark'} p-3 text-center font-bold transition duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Cargando...
                                    </span>
                                ) : (
                                    'Registrarse'
                                )}
                            </button>
                        </ClickSpark>
                    </form>

                    <div className="mt-6 text-center">
                        <p className={textColorClass}>
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="font-bold text-indigo-500 hover:text-indigo-600">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link to="/" className={`text-sm ${textColorClass} hover:underline`}>
                            Volver a la página de inicio
                        </Link>
                    </div>
                </div>
            </FadeContent>
        </div>
    );
};

export default Register;