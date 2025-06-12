import { UserX } from 'lucide-react'; 
const DenunciadosCard = ({
    usuarios,
    loading,
    error,
    cardBgClass,
    textClass,
    textSecondaryClass }) => {

    if (loading) {
        return (
            <div className={`${cardBgClass} rounded-lg  p-6`}>
                <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                    <UserX className="mr-2" size={24} />
                    Usuarios Denunciados
                </h2>
                <div className="py-8 text-center">
                    <p>Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
                <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                    <UserX className="mr-2" size={24} />
                    Usuarios Denunciados
                </h2>
                <div className="py-8 text-center text-red-500">
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${cardBgClass} rounded-lg  p-6`}>
            <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                <UserX className="mr-2" size={24} />
                Usuarios Denunciados
            </h2>

            {usuarios.length === 0 ? (
                <div className={`${textSecondaryClass} text-center py-8`}>
                    <UserX size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay usuarios denunciados</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {usuarios.map(usuario => (
                        <div
                            key={usuario.usuario.id}
                            className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800"
                        >
                            <div className="flex items-center">

                                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {(usuario?.usuario.nombre || '').charAt(0)}{(usuario?.usuario.apellido || '').charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-medium">
                                        {usuario.usuario.nombre} {usuario.usuario.apellido}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        @{usuario.usuario.userName}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
                                {usuario.cantidad} denuncia{usuario.cantidad !== 1 ? 's' : ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default DenunciadosCard;