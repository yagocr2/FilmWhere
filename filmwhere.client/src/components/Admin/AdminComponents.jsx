import React, { useState } from 'react';
import {
    Users, UserCheck, UserX, UserPlus, TrendingUp, Activity, Shield, Crown,
    Plus, Edit, Trash2, Save, X, AlertTriangle, Search, Filter,
    Lock, Unlock, Mail, MailCheck, Eye, Calendar,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAdminTheme } from '../../hooks/Admin/useAdminTheme';

// Componente de tarjeta de estadística
export const StatCard = ({ title, value, icon, color, subtitle, loading }) => {
    const { cardBgClass, textClass, textSecondaryClass } = useAdminTheme();

    return (
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
};

// Componente de encabezado de página
export const PageHeader = ({ icon, title, subtitle, actionButton }) => {
    const { textClass, textSecondaryClass } = useAdminTheme();

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`rounded-lg p-3 ${icon.bgColor}`}>
                    {React.cloneElement(icon.component, { className: "text-white", size: icon.size || 24 })}
                </div>
                <div>
                    <h1 className={`${textClass} text-2xl font-bold`}>{title}</h1>
                    <p className={textSecondaryClass}>{subtitle}</p>
                </div>
            </div>
            {actionButton}
        </div>
    );
};

// Componente de estado de loading
export const LoadingSpinner = ({ text = "Cargando..." }) => {
    const { textSecondaryClass } = useAdminTheme();

    return (
        <div className="p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className={`${textSecondaryClass} mt-2`}>{text}</p>
        </div>
    );
};

// Componente de error
export const ErrorDisplay = ({ error, onRetry, retryText = "Reintentar" }) => {
    const { cardBgClass, textClass, textSecondaryClass } = useAdminTheme();

    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-8 text-center`}>
            <div className="mb-4 text-red-500">
                <Activity size={48} className="mx-auto" />
            </div>
            <h3 className={`${textClass} text-xl font-semibold mb-2`}>Error al cargar datos</h3>
            <p className={`${textSecondaryClass} mb-4`}>{error}</p>
            <button
                onClick={onRetry}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
                {retryText}
            </button>
        </div>
    );
};

// Componente de modal genérico
export const Modal = ({ show, onClose, title, icon, children, size = "max-w-md" }) => {
    const { cardBgClass, textClass, textSecondaryClass } = useAdminTheme();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`${cardBgClass} rounded-lg shadow-xl ${size} w-full max-h-[90vh] overflow-y-auto`}>
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className={`${textClass} text-xl font-semibold flex items-center`}>
                            {icon && React.cloneElement(icon, { className: "mr-2", size: 24 })}
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className={`${textSecondaryClass} hover:${textClass} transition-colors`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Componente de badge de estado
export const StatusBadge = ({ user, onResendEmail, isResending }) => {
    const handleResendClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (onResendEmail && !isResending) {
            try {
                await onResendEmail(user.id);
            } catch (error) {
                console.error('Error al reenviar email:', error);
            }
        }
    };

    if (!user.activo) {
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                <UserX size={12} className="mr-1" />
                Bloqueado
            </span>
        );
    }

    if (!user.emailConfirmed) {
        return (
            <button
                onClick={handleResendClick}
                disabled={isResending}
                className="inline-flex cursor-pointer items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 transition-colors hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
                title="Click para reenviar email de confirmación"
            >
                <Mail size={12} className="mr-1" />
                {isResending ? 'Enviando...' : 'Sin confirmar'}
            </button>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <UserCheck size={12} className="mr-1" />
            Activo
        </span>
    );
};

// Componente de barra de búsqueda
export const SearchBar = ({ searchTerm, onSearch, placeholder = "Buscar..." }) => {
    const { inputBgClass, textClass, borderClass, textSecondaryClass } = useAdminTheme();

    return (
        <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondaryClass}`} size={20} />
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className={`${inputBgClass} ${textClass} ${borderClass} border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
        </div>
    );
};

// Componente de paginación
export const Pagination = ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    itemName = "elementos"
}) => {
    const { textSecondaryClass } = useAdminTheme();

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className={`${textSecondaryClass} text-sm`}>
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} {itemName}
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + Math.max(1, currentPage - 2);
                    if (pageNum > totalPages) return null;

                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Componente de formulario de rol
export const RoleForm = ({ formData, setFormData, onSubmit, onCancel }) => {
    const { inputBgClass, textClass, borderClass } = useAdminTheme();

    return (
        <form onSubmit={onSubmit}>
            <div className="space-y-4">
                <div>
                    <label className={`${textClass} block text-sm font-medium mb-1`}>
                        Nombre del Rol
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required
                    />
                </div>
                <div>
                    <label className={`${textClass} block text-sm font-medium mb-1`}>
                        Descripción
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`${inputBgClass} ${textClass} ${borderClass} w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        rows="3"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                    <Save size={16} />
                    <span>Guardar</span>
                </button>
            </div>
        </form>
    );
};

// Componente de confirmación de eliminación
export const DeleteConfirmation = ({ itemName, itemType = "elemento", onConfirm, onCancel }) => {
    const { textSecondaryClass, inputBgClass, textClass } = useAdminTheme();

    return (
        <div>
            <div className="mb-4 flex items-center text-red-600">
                <AlertTriangle className="mr-2" size={24} />
                <span className="text-lg font-medium">¿Confirmar eliminación?</span>
            </div>
            <p className={`${textSecondaryClass} mb-6`}>
                ¿Estás seguro de que deseas eliminar el {itemType} "{itemName}"?
                Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
                <button
                    onClick={onCancel}
                    className={`px-4 py-2 rounded-lg ${inputBgClass} ${textClass} hover:bg-gray-200 transition-colors`}
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirm}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
};

// Componente de acciones rápidas
export const QuickActions = ({ actions }) => {
    const { cardBgClass, textClass } = useAdminTheme();

    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
            <h2 className={`${textClass} text-xl font-semibold mb-6 flex items-center`}>
                <TrendingUp className="mr-2" size={24} />
                Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`${action.bgColor} ${action.hoverColor} text-white p-4 rounded-lg transition-colors flex items-center space-x-3`}
                    >
                        {React.cloneElement(action.icon, { size: 24 })}
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};