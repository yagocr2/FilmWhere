import React from 'react';
import { Users, UserCheck, UserX, UserPlus, Shield, Crown, Activity } from 'lucide-react';
import { useAdminStats } from '../../../hooks/Admin/useAdminStats';
import { useAdminTheme } from '../../../hooks/Admin/useAdminTheme';
import {
    StatCard,
    PageHeader,
    LoadingSpinner,
    ErrorDisplay,
    QuickActions
} from '../../../components/Admin/AdminComponents';
import DenunciadosCard from '../../../components/Admin/DenunciadosCard';

const AdminDashboard = () => {
    const { stats, denuncias, loading, error, refetch } = useAdminStats();

    if (error) {
        return <ErrorDisplay error={error} onRetry={refetch} />;
    }

    const quickActions = [
        {
            icon: <Users />,
            label: "Gestionar Usuarios",
            bgColor: "bg-blue-600",
            hoverColor: "hover:bg-blue-700",
            onClick: () => window.location.href = '/admin/usuarios'
        },
        {
            icon: <UserCheck />,
            label: "Confirmar Emails",
            bgColor: "bg-yellow-600",
            hoverColor: "hover:bg-yellow-700",
            onClick: () => window.location.href = '/admin/usuarios?filter=unconfirmed'
        },
        //{
        //    icon: <Shield />,
        //    label: "Gestionar Roles",
        //    bgColor: "bg-purple-600",
        //    hoverColor: "hover:bg-purple-700",
        //    onClick: () => window.location.href = '/admin/roles'
        //}
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                icon={{ component: <Crown />, bgColor: "bg-red-600", size: 32 }}
                title="Panel de Administración"
                subtitle="Bienvenido al centro de control de FilmWhere"
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Usuarios"
                    value={stats?.totalUsuarios || 0}
                    icon={<Users className="text-blue-600" size={24} />}
                    color="border-l-blue-500"
                    subtitle="Usuarios registrados"
                    loading={loading}
                />

                <StatCard
                    title="Usuarios Confirmados"
                    value={stats?.usuariosConfirmados || 0}
                    icon={<UserCheck className="text-green-600" size={24} />}
                    color="border-l-green-500"
                    subtitle="Email verificado"
                    loading={loading}
                />

                <StatCard
                    title="Usuarios Bloqueados"
                    value={stats?.usuariosBloqueados || 0}
                    icon={<UserX className="text-red-600" size={24} />}
                    color="border-l-red-500"
                    subtitle="Cuentas suspendidas"
                    loading={loading}
                />

                <StatCard
                    title="Nuevos (30 días)"
                    value={stats?.registrosUltimos30Dias || 0}
                    icon={<UserPlus className="text-purple-600" size={24} />}
                    color="border-l-purple-500"
                    subtitle="Registros recientes"
                    loading={loading}
                />
            </div>

            <QuickActions actions={quickActions} />

            {/* Recent Activity Placeholder */}
            <RecentActivityPlaceholder
                denuncias={denuncias}
                loading={loading}
                error={error}
            />
        </div>
    );
};

const RecentActivityPlaceholder = ({ denuncias, loading, error }) => {
    const { cardBgClass, textClass, textSecondaryClass } = useAdminTheme();

    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
            <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                <Activity className="mr-2" size={24} />
                Denuncias
            </h2>
            <div className={`${textSecondaryClass} text-center py-8`}>
                <DenunciadosCard
                    usuarios={denuncias}
                    loading={loading}
                    error={error}
                    cardBgClass={cardBgClass}
                    textClass={textClass}
                    textSecondaryClass={textSecondaryClass}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;