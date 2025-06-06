import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import LiquidChrome from '../../Backgrounds/LiquidChrome/LiquidChrome';
import FadeContent from '../../Animations/FadeContent/FadeContent';
import ClickSpark from '../../Animations/ClickSpark/ClickSpark';
import ScrollVelocity from '../../TextAnimations/ScrollVelocity/ScrollVelocity';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, XCircle, Mail, ArrowRight } from 'lucide-react';

const EmailConfirmation = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error', 'already-confirmed'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const statusParam = searchParams.get('status');

        // Si viene del backend con un status específico
        if (statusParam) {
            switch (statusParam) {
                case 'success':
                    setStatus('success');
                    setMessage('¡Excelente! Tu email ha sido confirmado exitosamente. Ya puedes iniciar sesión en tu cuenta.');
                    break;
                case 'already-confirmed':
                    setStatus('already-confirmed');
                    setMessage('Tu email ya había sido confirmado anteriormente. Puedes iniciar sesión normalmente.');
                    break;
                case 'invalid':
                    setStatus('error');
                    setMessage('Enlace de confirmación inválido. Faltan parámetros necesarios.');
                    break;
                case 'user-not-found':
                    setStatus('error');
                    setMessage('Usuario no encontrado. El enlace puede ser inválido.');
                    break;
                case 'error':
                default:
                    setStatus('error');
                    setMessage('Error al confirmar el email. El enlace puede haber expirado.');
                    break;
            }
            return;
        }

        // Lógica original para cuando se accede directamente con userId y token
        const confirmEmail = async () => {
            const userId = searchParams.get('userId');
            const token = searchParams.get('token');

            if (!userId || !token) {
                setStatus('error');
                setMessage('Enlace de confirmación inválido. Faltan parámetros necesarios.');
                return;
            }

            try {
                const response = await fetch(`/api/Auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.message && data.message.includes('ya ha sido confirmado')) {
                        setStatus('already-confirmed');
                        setMessage('Tu email ya había sido confirmado anteriormente. Puedes iniciar sesión normalmente.');
                    } else {
                        setStatus('success');
                        setMessage('¡Excelente! Tu email ha sido confirmado exitosamente. Ya puedes iniciar sesión en tu cuenta.');
                    }
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Error al confirmar el email. El enlace puede haber expirado.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Error de conexión. Por favor intenta más tarde.');
            }
        };

        confirmEmail();
    }, [searchParams]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    const primaryColorClass = theme === 'dark' ? 'bg-primario-dark' : 'bg-primario';
    const textColorClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
            case 'already-confirmed':
                return <CheckCircle className="h-16 w-16 text-green-500" />;
            case 'error':
                return <XCircle className="h-16 w-16 text-red-500" />;
            case 'loading':
            default:
                return (
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                );
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
            case 'already-confirmed':
                return 'bg-green-500 bg-opacity-20 text-green-700 border-green-300';
            case 'error':
                return 'bg-red-500 bg-opacity-20 text-red-700 border-red-300';
            case 'loading':
            default:
                return 'bg-blue-500 bg-opacity-20 text-blue-700 border-blue-300';
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'success':
                return 'Email Confirmado';
            case 'already-confirmed':
                return 'Email Ya Confirmado';
            case 'error':
                return 'Error de Confirmación';
            case 'loading':
            default:
                return 'Confirmando Email';
        }
    };

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
                            texts={['FilmWhere', getTitle()]}
                            velocity={15}
                        />
                    </div>

                    {/* Status Icon */}
                    <div className="mb-6 flex justify-center">
                        {getStatusIcon()}
                    </div>

                    {/* Status Message */}
                    <div className={`mb-6 rounded-lg border p-4 backdrop-blur-sm ${getStatusColor()}`}>
                        <div className="flex items-start gap-3">
                            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <p className="text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        {(status === 'success' || status === 'already-confirmed') && (
                            <ClickSpark sparkColor={theme === 'dark' ? "#fff" : "#333"}>
                                <button
                                    onClick={handleLoginRedirect}
                                    className={`w-full transform rounded-lg ${theme === 'dark' ? 'bg-primario text-texto' : 'bg-primario-dark text-texto-dark'} p-3 text-center font-bold transition duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2`}
                                >
                                    Iniciar Sesión
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </ClickSpark>
                        )}

                        {status === 'error' && (
                            <div className="space-y-3">
                                <Link to="/register">
                                    <ClickSpark sparkColor={theme === 'dark' ? "#fff" : "#333"}>
                                        <button className={`w-full transform rounded-lg ${theme === 'dark' ? 'bg-primario text-texto' : 'bg-primario-dark text-texto-dark'} p-3 text-center font-bold transition duration-300 hover:scale-105 hover:shadow-lg`}>
                                            Registrarse de Nuevo
                                        </button>
                                    </ClickSpark>
                                </Link>

                                <Link to="/login">
                                    <button className={`w-full rounded-lg border-2 ${theme === 'dark' ? 'border-primario text-primario hover:bg-primario hover:text-texto' : 'border-primario-dark text-primario-dark hover:bg-primario-dark hover:text-texto-dark'} p-3 text-center font-bold transition duration-300`}>
                                        Ir a Iniciar Sesión
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Loading state */}
                    {status === 'loading' && (
                        <div className="text-center">
                            <p className={`text-sm ${textColorClass}`}>
                                Procesando tu confirmación, por favor espera...
                            </p>
                        </div>
                    )}

                    {/* Back to home link */}
                    <div className="mt-6 text-center">
                        <Link to="/" className={`text-sm ${textColorClass} hover:underline`}>
                            Volver a la página de inicio
                        </Link>
                    </div>
                </div>
            </FadeContent>
        </div>
    );
};

export default EmailConfirmation;