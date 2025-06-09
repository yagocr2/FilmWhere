import React from 'react';
import { Eye, Calendar, MailCheck, Shield, AlertTriangle } from 'lucide-react';
import { Modal, StatusBadge } from '../../../components/Admin/AdminComponents';

export const ViewUserModal = ({
    show,
    onClose,
    user,
    textClass,
    textSecondaryClass,
    inputBgClass
}) => {
    if (!user) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Detalles del Usuario"
            icon={<Eye />}
            size="max-w-2xl"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UserDetailField
                        label="Nombre de usuario"
                        value={user.userName}
                        textClass={textClass}
                        textSecondaryClass={textSecondaryClass}
                    />

                    <div>
                        <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                            Email
                        </label>
                        <p className={`${textClass} font-medium flex items-center`}>
                            {user.email}
                            {user.emailConfirmed && (
                                <MailCheck size={16} className="ml-2 text-green-600" />
                            )}
                        </p>
                    </div>

                    <UserDetailField
                        label="Nombre completo"
                        value={`${user.nombre} ${user.apellido}`}
                        textClass={textClass}
                        textSecondaryClass={textSecondaryClass}
                    />

                    <div>
                        <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                            Fecha de registro
                        </label>
                        <p className={`${textClass} font-medium flex items-center`}>
                            <Calendar size={16} className="mr-2" />
                            {new Date(user.fechaRegistro).toLocaleDateString()}
                        </p>
                    </div>

                    {user.fechaNacimiento && (
                        <UserDetailField
                            label="Fecha de nacimiento"
                            value={new Date(user.fechaNacimiento).toLocaleDateString()}
                            textClass={textClass}
                            textSecondaryClass={textSecondaryClass}
                        />
                    )}

                    <div>
                        <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                            Estado
                        </label>
                        <StatusBadge user={user} />
                    </div>
                </div>

                <UserRolesDisplay
                    roles={user.roles}
                    textSecondaryClass={textSecondaryClass}
                />
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
                <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                >
                    Cerrar
                </button>
            </div>
        </Modal>
    );
};

export const DeleteUserModal = ({
    show,
    onClose,
    onConfirm,
    user,
    textSecondaryClass,
    inputBgClass,
    textClass
}) => {
    if (!user) return null;

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Confirmar Eliminación"
            icon={<AlertTriangle />}
            size="max-w-md"
        >
            <div>
                <div className="mb-4 flex items-center text-red-600">
                    <AlertTriangle className="mr-2" size={24} />
                    <span className="text-lg font-medium">¿Confirmar eliminación?</span>
                </div>
                <p className={`${textSecondaryClass} mb-6`}>
                    ¿Estás seguro de que deseas eliminar al usuario "{user.userName}"?
                    Esta acción no se puede deshacer y se eliminarán todos los datos asociados.
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(user.id, user.userName)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const UserDetailField = ({ label, value, textClass, textSecondaryClass }) => {
    return (
        <div>
            <label className={`${textSecondaryClass} text-sm font-medium block mb-1`}>
                {label}
            </label>
            <p className={`${textClass} font-medium`}>{value}</p>
        </div>
    );
};

const UserRolesDisplay = ({ roles, textSecondaryClass }) => {
    return (
        <div>
            <label className={`${textSecondaryClass} text-sm font-medium block mb-2`}>
                Roles
            </label>
            <div className="flex flex-wrap gap-2">
                {roles?.map((role) => (
                    <span
                        key={role}
                        className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                        <Shield size={12} className="mr-1" />
                        {role}
                    </span>
                ))}
            </div>
        </div>
    );
};