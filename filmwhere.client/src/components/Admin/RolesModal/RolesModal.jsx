import React, { useState, useEffect } from 'react';
import { Shield, Save, X, UserCheck, UserX } from 'lucide-react';
import { Modal } from '../AdminComponents';

const RolesModal = ({
    show,
    onClose,
    user,
    availableRoles,
    onUpdateRoles,
    textClass,
    textSecondaryClass,
    inputBgClass,
    borderClass
}) => {
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && user.roles) {
            setSelectedRoles([...user.roles]);
        }
    }, [user]);

    const handleRoleToggle = (roleName) => {
        setSelectedRoles(prev =>
            prev.includes(roleName)
                ? prev.filter(r => r !== roleName)
                : [...prev, roleName]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onUpdateRoles(user.id, selectedRoles);
            onClose();
        } catch (error) {
            console.error('Error updating roles:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasChanges = () => {
        if (!user.roles) return selectedRoles.length > 0;
        return JSON.stringify([...user.roles].sort()) !== JSON.stringify([...selectedRoles].sort());
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            title={`Gestionar Roles - ${user?.userName}`}
            icon={<Shield />}
            size="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p className={`${textSecondaryClass} text-sm mb-4`}>
                        Selecciona los roles que tendrá el usuario <strong>{user?.userName}</strong>
                    </p>

                    <div className="space-y-3">
                        {availableRoles.map((role) => {
                            const isSelected = selectedRoles.includes(role);
                            const wasOriginallySelected = user?.roles?.includes(role);

                            return (
                                <div
                                    key={role}
                                    className={`${inputBgClass} ${borderClass} border rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700`}
                                >
                                    <label className="flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleRoleToggle(role)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`${textClass} font-medium`}>
                                                    {role}
                                                </span>
                                                <div className="flex items-center space-x-1">
                                                    {isSelected && (
                                                        <UserCheck size={16} className="text-green-600" />
                                                    )}
                                                    {!isSelected && wasOriginallySelected && (
                                                        <UserX size={16} className="text-red-600" />
                                                    )}
                                                </div>
                                            </div>
                                            <p className={`${textSecondaryClass} text-xs mt-1`}>
                                                {getRoleDescription(role)}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    {selectedRoles.length === 0 && (
                        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-800">
                                ?? El usuario no tendrá ningún rol asignado. Se recomienda asignar al menos el rol "Registrado".
                            </p>
                        </div>
                    )}
                </div>

                {/* Resumen de cambios */}
                {hasChanges() && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <h4 className="mb-2 text-sm font-medium text-blue-800">Cambios pendientes:</h4>
                        <div className="space-y-1 text-sm">
                            {/* Roles añadidos */}
                            {selectedRoles.filter(role => !user?.roles?.includes(role)).map(role => (
                                <div key={role} className="flex items-center text-green-700">
                                    <span className="mr-1">+</span>
                                    <span>Áñadir rol: {role}</span>
                                </div>
                            ))}
                            {/* Roles removidos */}
                            {user?.roles?.filter(role => !selectedRoles.includes(role)).map(role => (
                                <div key={role} className="flex items-center text-red-700">
                                    <span className="mr-1">-</span>
                                    <span>Remover rol: {role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 border-t pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors flex items-center space-x-2`}
                        disabled={isSubmitting}
                    >
                        <X size={16} />
                        <span>Cancelar</span>
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !hasChanges()}
                        className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={16} />
                        <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Función auxiliar para obtener la descripción de cada rol
const getRoleDescription = (role) => {
    const descriptions = {
        'Administrador': 'Acceso completo al sistema y gestión de usuarios',
        'Registrado': 'Usuario registrado con acceso básico',
    };

    return descriptions[role] || 'Rol personalizado del sistema';
};

export default RolesModal;