import React, { useState, useEffect } from 'react';
import { Edit, Save, X, User, Mail, Calendar, Shield } from 'lucide-react';
import { Modal } from '../AdminComponents';

const EditUserModal = ({
    show,
    onClose,
    user,
    onSubmit,
    availableRoles,
    textClass,
    textSecondaryClass,
    inputBgClass,
    borderClass
}) => {
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        emailConfirmed: false,
        roles: []
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName || '',
                email: user.email || '',
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.split('T')[0] : '',
                emailConfirmed: user.emailConfirmed || false,
                roles: user.roles || []
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.userName.trim()) {
            newErrors.userName = 'El nombre de usuario es obligatorio';
        } else if (formData.userName.length < 2) {
            newErrors.userName = 'El nombre de usuario debe tener al menos 2 caracteres';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El formato del email no es válido';
        }

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es obligatorio';
        } else if (formData.apellido.length < 2) {
            newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
        }

        if (!formData.fechaNacimiento) {
            newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
        } else {
            const birthDate = new Date(formData.fechaNacimiento);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                newErrors.fechaNacimiento = 'El usuario debe tener al menos 13 a�os';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(user.id, formData);
        } catch (error) {
            console.error('Error updating user:', error);
            // El error se maneja en el componente padre
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleToggle = (roleName) => {
        const newRoles = formData.roles.includes(roleName)
            ? formData.roles.filter(r => r !== roleName)
            : [...formData.roles, roleName];

        setFormData({ ...formData, roles: newRoles });
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Editar Usuario"
            icon={<Edit />}
            size="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className={`${textClass} block text-sm font-medium mb-2`}>
                            <User size={16} className="mr-1 inline" />
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={formData.userName}
                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.userName ? 'border-red-500' : ''
                                }`}
                            placeholder="Ingrese el nombre de usuario"
                        />
                        {errors.userName && (
                            <p className="mt-1 text-sm text-red-500">{errors.userName}</p>
                        )}
                    </div>

                    <div>
                        <label className={`${textClass} block text-sm font-medium mb-2`}>
                            <Mail size={16} className="mr-1 inline" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''
                                }`}
                            placeholder="Ingrese el email"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className={`${textClass} block text-sm font-medium mb-2`}>
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-500' : ''
                                }`}
                            placeholder="Ingrese el nombre"
                        />
                        {errors.nombre && (
                            <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
                        )}
                    </div>

                    <div>
                        <label className={`${textClass} block text-sm font-medium mb-2`}>
                            Apellido
                        </label>
                        <input
                            type="text"
                            value={formData.apellido}
                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.apellido ? 'border-red-500' : ''
                                }`}
                            placeholder="Ingrese el apellido"
                        />
                        {errors.apellido && (
                            <p className="mt-1 text-sm text-red-500">{errors.apellido}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className={`${textClass} block text-sm font-medium mb-2`}>
                        <Calendar size={16} className="mr-1 inline" />
                        Fecha de Nacimiento
                    </label>
                    <input
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fechaNacimiento ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.fechaNacimiento && (
                        <p className="mt-1 text-sm text-red-500">{errors.fechaNacimiento}</p>
                    )}
                </div>

                {/* Estado del email */}
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="emailConfirmed"
                        checked={formData.emailConfirmed}
                        onChange={(e) => setFormData({ ...formData, emailConfirmed: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="emailConfirmed" className={`${textClass} text-sm font-medium`}>
                        Email confirmado
                    </label>
                </div>

                {/* Gestión de Roles */}
                <div>
                    <label className={`${textClass} block text-sm font-medium mb-3`}>
                        <Shield size={16} className="mr-1 inline" />
                        Roles del Usuario
                    </label>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {availableRoles.map((role) => (
                            <div key={role} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`role-${role}`}
                                    checked={formData.roles.includes(role)}
                                    onChange={() => handleRoleToggle(role)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor={`role-${role}`}
                                    className={`${textClass} ml-2 text-sm font-medium cursor-pointer`}
                                >
                                    {role}
                                </label>
                            </div>
                        ))}
                    </div>
                    <p className={`${textSecondaryClass} text-sm mt-2`}>
                        Selecciona los roles que tendrá este usuario
                    </p>
                </div>

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
                        disabled={isSubmitting}
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

export default EditUserModal;