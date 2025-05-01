import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa el hook

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({ identifier: '', email: '', password: '', userName: '' }); // Añade userName
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // Usa el contexto

    const handleModeChange = () => {
        setIsLoginMode(!isLoginMode);
        setFormData({ identifier: '', email: '', password: '', userName: '' });
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLoginMode ? 'login' : 'register';
            // Asegúrate que el modelo enviado coincida con el esperado
            const dataToSend =
                isLoginMode
                    ? { identifier: formData.identifier, password: formData.password }
                    : { userName: formData.userName, email: formData.email, password: formData.password }// Para el registro usa userName


            //const response = await axios.post(
            //    `https://localhost:7179/api/Auth/${endpoint}`,
            //    dataToSend
            //);
            const response = await axios.post(
                `/api/Auth/${endpoint}`,
                dataToSend
            );

            if (response.data.Token) {
                login(response.data.Token); // Usa el método del contexto
                navigate('/dashboard');
            } else if (response.data.Message) {
                setError(null);
                //setSuccessMessage(response.data.Message);
                // Opcionalmente cambiar a modo login después de registro exitoso
                if (!isLoginMode) setTimeout(() => setIsLoginMode(true), 2000);
            }
        } catch (err) {
            if (err.response) {
                console.error('Detalles del error:', err.response.data)
                setError(err.response.data.Message || JSON.stringify(err.response.data) || 'Error de servidor');
            } else {
                setError('Error de conexión');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full min-h-[400px] flex bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
                {/* Formulario */}
                <div
                    className={`w-1/2 p-8 z-10 transition-all duration-500 ease-in-out ${isLoginMode ? 'order-1' : 'order-2'}`}
                >
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{error}</div>}

                        {/* Mostrar campo userName solo en modo registro */}
                        {!isLoginMode && (
                            <div>
                                <label className="block text-gray-700 mb-2">Nombre de usuario</label>
                                <input
                                    type="text"
                                    name="userName"
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                        )}
                        {isLoginMode
                            ?
                            (<div>
                                <label className="block text-gray-700 mb-2">Email/User Name</label>
                                <input
                                    type="text"
                                    name="identifier"
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>)
                            :
                            (<div>
                                <label className="block text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            )}

                        <div>
                            <label className="block text-gray-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition duration-300"
                        >
                            {isLoginMode ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                    </form>
                </div>

                {/* Message Box */}
                <div
                    className={`w-1/2 bg-purple-700 flex items-center justify-center p-8 transition-all duration-500 ease-in-out ${isLoginMode ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                >
                    <div className="text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">
                            {isLoginMode ? '¿Nuevo aquí?' : '¡Bienvenido de vuelta!'}
                        </h2>
                        <p className="mb-6">
                            {isLoginMode
                                ? 'Regístrate para comenzar tu experiencia'
                                : 'Inicia sesión para continuar donde lo dejaste'}
                        </p>
                        <button
                            onClick={handleModeChange}
                            className="px-4 py-2 border-2 border-white rounded-lg hover:bg-white hover:text-purple-700 transition duration-300"
                        >
                            {isLoginMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;