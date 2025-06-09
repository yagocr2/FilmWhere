import React from 'react';
import { Users, Eye, Lock, Unlock, MailCheck, Trash2, Edit, Shield } from 'lucide-react';
import { StatusBadge } from '../../../components/Admin/AdminComponents';

const UsersTable = ({
    usuarios,
    onViewUser,
    onEditUser,
    onManageRoles,
    onConfirmEmail,
    onToggleBlock,
    onDeleteUser,
    onResendEmail,
    isResendingEmail,
    cardBgClass,
    textClass,
    textSecondaryClass
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className={`bg-gray-50 dark:bg-gray-800`}>
                    <tr>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Usuario
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Email
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Estado
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Roles
                        </th>
                        <th className={`${textClass} px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                            Fecha Registro
                        </th>
                        <th className={`${textClass} px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`}>
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className={`${cardBgClass} divide-y divide-gray-200`}>
                    {usuarios.map((user) => (
                        <UserTableRow
                            key={user.id}
                            user={user}
                            onViewUser={onViewUser}
                            onEditUser={onEditUser}
                            onManageRoles={onManageRoles}
                            onConfirmEmail={onConfirmEmail}
                            onToggleBlock={onToggleBlock}
                            onDeleteUser={onDeleteUser}
                            textClass={textClass}
                            textSecondaryClass={textSecondaryClass}
                            onResendEmail={onResendEmail}
                            isResendingEmail={isResendingEmail}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const UserTableRow = ({
    user,
    onViewUser,
    onEditUser,
    onManageRoles,
    onConfirmEmail,
    onToggleBlock,
    onDeleteUser,
    textClass,
    textSecondaryClass,
    onResendEmail,
    isResendingEmail
}) => {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                            <Users size={20} className="text-gray-600" />
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className={`${textClass} text-sm font-medium`}>
                            {user.userName}
                        </div>
                        <div className={`${textSecondaryClass} text-sm`}>
                            {user.nombre} {user.apellido}
                        </div>
                    </div>
                </div>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
                <div className={`${textClass} text-sm`}>{user.email}</div>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
                <StatusBadge
                    user={user}
                    onResendEmail={onResendEmail}
                    isResendingEmail={isResendingEmail}
                    isResending={isResendingEmail ? isResendingEmail(user.id) : false}
                />
            </td>
            <td className="whitespace-nowrap px-6 py-4">
                <RolesBadges
                    roles={user.roles}
                    onManageRoles={() => onManageRoles(user)}
                />
            </td>
            <td className="whitespace-nowrap px-6 py-4">
                <div className={`${textSecondaryClass} text-sm`}>
                    {new Date(user.fechaRegistro).toLocaleDateString()}
                </div>
            </td>
            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <UserActions
                    user={user}
                    onViewUser={onViewUser}
                    onEditUser={onEditUser}
                    onConfirmEmail={onConfirmEmail}
                    onToggleBlock={onToggleBlock}
                    onDeleteUser={onDeleteUser}
                />
            </td>
        </tr>
    );
};

const RolesBadges = ({ roles, onManageRoles }) => {
    const handleRolesClick = (e) => {
        e.stopPropagation();
        onManageRoles();
    };

    return (
        <div className="flex flex-wrap gap-1">
            {roles?.slice(0, 2).map((role) => (
                <span
                    key={role}
                    onClick={handleRolesClick}
                    className="inline-flex cursor-pointer items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200"
                    title="Click para gestionar roles"
                >
                    {role}
                </span>
            ))}
            {roles?.length > 2 && (
                <span
                    onClick={handleRolesClick}
                    className="cursor-pointer rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
                    title="Click para gestionar todos los roles"
                >
                    +{roles.length - 2}
                </span>
            )}
            {(!roles || roles.length === 0) && (
                <button
                    onClick={handleRolesClick}
                    className="inline-flex cursor-pointer items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    title="Click para asignar roles"
                >
                    <Shield size={12} className="mr-1" />
                    Sin roles
                </button>
            )}
        </div>
    );
};

const UserActions = ({
    user,
    onViewUser,
    onEditUser,
    onConfirmEmail,
    onToggleBlock,
    onDeleteUser
}) => {
    return (
        <div className="flex items-center justify-end space-x-2">
            <button
                onClick={() => onViewUser(user.id)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Ver detalles"
            >
                <Eye size={16} />
            </button>
            <button
                onClick={() => onEditUser(user.id)}
                className="text-green-600 hover:text-green-900 transition-colors"
                title="Editar usuario"
            >
                <Edit size={16} />
            </button>
            {!user.emailConfirmed && (
                <button
                    onClick={() => onConfirmEmail(user.id)}
                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    title="Confirmar email"
                >
                    <MailCheck size={16} />
                </button>
            )}
            <button
                onClick={() => onToggleBlock(user.id, !user.activo)}
                className={`${user.activo ? 'text-red-600 hover:text-red-900' : 'text-orange-600 hover:text-orange-900'} transition-colors`}
                title={user.activo ? 'Bloquear usuario' : 'Desbloquear usuario'}
            >
                {user.activo ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <button
                onClick={() => onDeleteUser(user)}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="Eliminar usuario"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export default UsersTable;