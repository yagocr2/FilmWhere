import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LiquidChrome from '../../Backgrounds/LiquidChrome/LiquidChrome';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import ClickSpark from '../../Animations/ClickSpark/ClickSpark';
import ScrollVelocity from '../../TextAnimations/ScrollVelocity/ScrollVelocity';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';

const Login = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [error, setError] = useState('');
    const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !loading) {
            navigate('/inicio');
        }
    }, [isAuthenticated, loading, navigate]);

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpiar mensajes de error cuando el usuario empiece a escribir
        if (error) setError('');
        if (resendMessage) setResendMessage('');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.identifier.trim()) {
            setError('Por favor ingrese su nombre de usuario o email');
            return;
        }

        if (!formData.password) {
            setError('Por favor ingrese su contraseña');
            return;
        }

        setIsLoading(true);
        setError('');
        setRequiresEmailConfirmation(false);
        setResendMessage('');

        try {
            const response = await fetch('/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: formData.identifier,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Verificar si es error de confirmación de email
                if (data.requiresEmailConfirmation) {
                    setRequiresEmailConfirmation(true);
                    setUserEmail(data.email || formData.identifier);
                    setError(data.message || 'Debes confirmar tu email antes de iniciar sesión');
                } else {
                    setError(data.message || 'Error al iniciar sesión');
                }
                return;
            }

            // Login exitoso
            login(data.token);
            navigate('/inicio');
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        setIsResendingEmail(true);
        setResendMessage('');
        setError('');

        try {
            const response = await fetch('/api/Auth/resend-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResendMessage('Se ha enviado un nuevo email de confirmación. Por favor revisa tu bandeja de entrada.');
            } else {
                setError(data.message || 'Error al reenviar el email de confirmación');
            }
        } catch (err) {
            setError('Error al reenviar el email de confirmación');
        } finally {
            setIsResendingEmail(false);
        }
    };

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="border-primario h-16 w-16 animate-spin rounded-full border-b-2 border-t-2"></div>
            </div>
        );
    }

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
                    <div className="mb-6 text-center">
                        <ScrollVelocity
                            className="text-shadow text-texto text-4xl font-extrabold dark:text-texto-dark"
                            texts={['FilmWhere', 'Iniciar Sesión']}
                            velocity={15}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-500 bg-opacity-20 p-3 text-red-700 backdrop-blur-sm">
                            <div className="flex items-start gap-2">
                                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p>{error}</p>
                                    {requiresEmailConfirmation && (
                                        <button
                                            onClick={handleResendConfirmation}
                                            disabled={isResendingEmail}
                                            className="mt-2 flex items-center gap-2 text-sm font-medium text-red-800 hover:text-red-900 disabled:opacity-50"
                                        >
                                            {isResendingEmail ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    Reenviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="h-4 w-4" />
                                                    Reenviar email de confirmación
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success message for email resend */}
                    {resendMessage && (
                        <div className="mb-4 rounded-lg bg-green-500 bg-opacity-20 p-3 text-green-700 backdrop-blur-sm">
                            <div className="flex items-start gap-2">
                                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                <p>{resendMessage}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="identifier" className={`block text-sm font-medium ${textColorClass}`}>
                                Nombre de usuario o Email
                            </label>
                            <input
                                type="text"
                                id="identifier"
                                name="identifier"
                                value={formData.identifier}
                                onChange={handleChange}
                                required
                                className={`mt-1 block w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                                placeholder="usuario o email@ejemplo.com"
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
                                    required
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
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </ClickSpark>
                    </form>

                    <div className="mt-6 text-center">
                        <p className={textColorClass}>
                            ¿No tienes una cuenta?{' '}
                            <Link to="/register" className="font-bold text-indigo-500 hover:text-indigo-600">
                                Regístrate
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

export default Login;