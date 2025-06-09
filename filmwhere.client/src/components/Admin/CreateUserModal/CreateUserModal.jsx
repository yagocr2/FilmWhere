// CreateUserModal.jsx - Mejoras en el manejo de errores y validación

import React, { useState, useCallback, useEffect } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { Modal } from '../../../components/Admin/AdminComponents';

const CreateUserModal = ({
    show,
    onClose,
    onSubmit,
    availableRoles = ['Registrado', 'Administrador'],
    textClass,
    inputBgClass,
    borderClass
}) => {
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        emailConfirmed: false,
        roles: []
    });

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverErrors, setServerErrors] = useState({}); // Para errores del servidor

    const resetForm = useCallback(() => {
        setFormData({
            userName: '',
            email: '',
            password: '',
            nombre: '',
            apellido: '',
            fechaNacimiento: '',
            emailConfirmed: false,
            roles: []
        });
        setFormErrors({});
        setServerErrors({});
        setIsSubmitting(false);
    }, []);

    useEffect(() => {
        if (!show) {
            resetForm();
        }
    }, [show, resetForm]);

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.userName.trim()) {
            errors.userName = 'El nombre de usuario es obligatorio';
        } else if (formData.userName.length < 2) {
            errors.userName = 'El nombre de usuario debe tener al menos 2 caracteres';
        } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.userName)) {
            errors.userName = 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos';
        }

        if (!formData.email.trim()) {
            errors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'El formato del email no es válido';
        }

        if (!formData.password.trim()) {
            errors.password = 'La contraseña es obligatoria';
        } else if (formData.password.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(formData.password)) {
            errors.password = 'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial (@$!%*?&)';
        }

        if (!formData.nombre.trim()) {
            errors.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.length < 2) {
            errors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.apellido.trim()) {
            errors.apellido = 'El apellido es obligatorio';
        } else if (formData.apellido.length < 2) {
            errors.apellido = 'El apellido debe tener al menos 2 caracteres';
        }

        if (!formData.fechaNacimiento) {
            errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
        } else {
            const birthDate = new Date(formData.fechaNacimiento);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13) {
                errors.fechaNacimiento = 'Debe ser mayor de 13 años';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Limpiar errores del servidor previos
        setServerErrors({});

        if (!validateForm()) {
            console.error('Form validation failed');
            return;
        }

        setIsSubmitting(true);
        try {
            const formattedData = {
                ...formData,
                fechaNacimiento: formData.fechaNacimiento
            };
            await onSubmit(formattedData);
            resetForm();
        } catch (error) {
            console.error('Error creating user:', error);

            // Manejar errores del servidor
            if (error.response && error.response.status === 400) {
                const errorData = error.response.data;

                if (errorData.errors) {
                    // Si hay errores de validación específicos
                    const newServerErrors = {};
                    Object.keys(errorData.errors).forEach(key => {
                        const fieldKey = key.toLowerCase();
                        newServerErrors[fieldKey] = Array.isArray(errorData.errors[key])
                            ? errorData.errors[key][0]
                            : errorData.errors[key];
                    });
                    setServerErrors(newServerErrors);
                } else if (errorData.message) {
                    // Error general
                    setServerErrors({ general: errorData.message });
                } else if (typeof errorData === 'string') {
                    setServerErrors({ general: errorData });
                }
            } else {
                setServerErrors({ general: 'Error inesperado al crear el usuario' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Limpiar errores cuando el usuario empiece a escribir
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
        if (serverErrors[field]) {
            setServerErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    }, [formErrors, serverErrors]);

    const handleRoleChange = useCallback((role, checked) => {
        setFormData(prev => ({
            ...prev,
            roles: checked
                ? [...prev.roles, role]
                : prev.roles.filter(r => r !== role)
        }));
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    return (
        <Modal
            show={show}
            onClose={handleClose}
            title="Crear Nuevo Usuario"
            icon={<UserPlus />}
            size="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mostrar error general */}
                {serverErrors.general && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-600">{serverErrors.general}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        label="Nombre de usuario *"
                        type="text"
                        value={formData.userName}
                        onChange={(value) => handleInputChange('userName', value)}
                        placeholder="Ingrese nombre de usuario"
                        error={formErrors.userName || serverErrors.username}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                    />

                    <FormField
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(value) => handleInputChange('email', value)}
                        placeholder="usuario@ejemplo.com"
                        error={formErrors.email || serverErrors.email}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                    />

                    <FormField
                        label="Contraseña *"
                        type="password"
                        value={formData.password}
                        onChange={(value) => handleInputChange('password', value)}
                        placeholder="Ej: MiPass123!"
                        error={formErrors.password || serverErrors.password}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                        helpText="Debe contener: mayúscula, minúscula, número y carácter especial"
                    />

                    <FormField
                        label="Fecha de Nacimiento *"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(value) => handleInputChange('fechaNacimiento', value)}
                        error={formErrors.fechaNacimiento || serverErrors.fechanacimiento}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                    />

                    <FormField
                        label="Nombre *"
                        type="text"
                        value={formData.nombre}
                        onChange={(value) => handleInputChange('nombre', value)}
                        placeholder="Ingrese nombre"
                        error={formErrors.nombre || serverErrors.nombre}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                    />

                    <FormField
                        label="Apellido *"
                        type="text"
                        value={formData.apellido}
                        onChange={(value) => handleInputChange('apellido', value)}
                        placeholder="Ingrese apellido"
                        error={formErrors.apellido || serverErrors.apellido}
                        textClass={textClass}
                        inputBgClass={inputBgClass}
                        borderClass={borderClass}
                    />
                </div>

                <RoleSelector
                    availableRoles={availableRoles}
                    selectedRoles={formData.roles}
                    onRoleChange={handleRoleChange}
                    textClass={textClass}
                />

                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.emailConfirmed}
                            onChange={(e) => handleInputChange('emailConfirmed', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className={`${textClass} ml-2 text-sm`}>Email confirmado</span>
                    </label>
                </div>

                <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={16} />
                        <span>{isSubmitting ? 'Creando...' : 'Crear Usuario'}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const FormField = ({
    label,
    type,
    value,
    onChange,
    placeholder,
    error,
    helpText,
    textClass,
    inputBgClass,
    borderClass
}) => {
    return (
        <div>
            <label className={`${textClass} block text-sm font-medium mb-1`}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
                placeholder={placeholder}
            />
            {helpText && !error && (
                <p className="mt-1 text-xs text-gray-400">{helpText}</p>
            )}
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

const RoleSelector = ({ availableRoles, selectedRoles, onRoleChange, textClass }) => {
    return (
        <div>
            <label className={`${textClass} block text-sm font-medium mb-2`}>
                Roles
            </label>
            <div className="space-y-2">
                {availableRoles.map((role) => (
                    <label key={role} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={(e) => onRoleChange(role, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className={`${textClass} ml-2 text-sm`}>{role}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default CreateUserModal;