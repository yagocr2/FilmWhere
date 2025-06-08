import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
    Users,
    UserCheck,
    UserX,
    UserPlus,
    TrendingUp,
    Activity,
    Shield,
    Crown
} from 'lucide-react';

const AdminDashboard = () => {
    const { theme } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEstadisticas();
    }, []);

    const fetchEstadisticas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const cardBgClass = theme === 'dark' ? 'bg-secundario-dark' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-texto-dark' : 'text-texto';
    const textSecondaryClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`${textSecondaryClass} text-sm font-medium uppercase tracking-wide`}>
                        {title}
                    </p>
                    <p className={`${textClass} text-3xl font-bold mt-2`}>
                        {loading ? '...' : value}
                    </p>
                    {subtitle && (
                        <p className={`${textSecondaryClass} text-sm mt-1`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    if (error) {
        return (
            <div className={`${cardBgClass} rounded-lg shadow-lg p-8 text-center`}>
                <div className="mb-4 text-red-500">
                    <Activity size={48} className="mx-auto" />
                </div>
                <h3 className={`${textClass} text-xl font-semibold mb-2`}>Error al cargar datos</h3>
                <p className={`${textSecondaryClass} mb-4`}>{error}</p>
                <button
                    onClick={fetchEstadisticas}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-red-600 p-3">
                    <Crown className="text-white" size={32} />
                </div>
                <div>
                    <h1 className={`${textClass} text-3xl font-bold`}>Panel de Administración</h1>
                    <p className={`${textSecondaryClass} text-lg`}>
                        Bienvenido al centro de control de FilmWhere
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Usuarios"
                    value={stats?.totalUsuarios || 0}
                    icon={<Users className="text-blue-600" size={24} />}
                    color="border-l-blue-500"
                    subtitle="Usuarios registrados"
                />

                <StatCard
                    title="Usuarios Confirmados"
                    value={stats?.usuariosConfirmados || 0}
                    icon={<UserCheck className="text-green-600" size={24} />}
                    color="border-l-green-500"
                    subtitle="Email verificado"
                />

                <StatCard
                    title="Usuarios Bloqueados"
                    value={stats?.usuariosBloqueados || 0}
                    icon={<UserX className="text-red-600" size={24} />}
                    color="border-l-red-500"
                    subtitle="Cuentas suspendidas"
                />

                <StatCard
                    title="Nuevos (30 días)"
                    value={stats?.registrosUltimos30Dias || 0}
                    icon={<UserPlus className="text-purple-600" size={24} />}
                    color="border-l-purple-500"
                    subtitle="Registros recientes"
                />
            </div>

            {/* Quick Actions */}
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
                <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                    <TrendingUp className="mr-2" size={24} />
                    Acciones Rápidas
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <button
                        onClick={() => window.location.href = '/admin/usuarios'}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                    >
                        <Users size={24} />
                        <span>Gestionar Usuarios</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/admin/usuarios?filter=unconfirmed'}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                    >
                        <UserCheck size={24} />
                        <span>Confirmar Emails</span>
                    </button>

                    <button
                        onClick={() => window.location.href = '/admin/roles'}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                    >
                        <Shield size={24} />
                        <span>Gestionar Roles</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
                <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                    <Activity className="mr-2" size={24} />
                    Actividad Reciente
                </h2>

                <div className={`${textSecondaryClass} text-center py-8`}>
                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                    <p>La funcionalidad de actividad reciente estará disponible próximamente</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;