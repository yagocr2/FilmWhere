import React from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import {
    PageHeader,
    LoadingSpinner,
    ErrorDisplay,
    Modal,
    RoleForm,
    DeleteConfirmation,
} from '../../../components/Admin/AdminComponents';
import { useAdminRoles } from '../../../hooks/Admin/useAdminRoles';
import { useModal } from '../../../hooks/useModal';


const AdminRoles = () => {
    const { roles, loading, error, createRole, updateRole, deleteRole, refetch } = useAdminRoles();
    const { showModal, modalType, modalData, openModal, closeModal } = useModal();
    const [formData, setFormData] = React.useState({ name: '', description: '' });

    const handleCreateRole = () => {
        setFormData({ name: '', description: '' });
        openModal('create');
    };

    const handleEditRole = (role) => {
        setFormData({ name: role.name, description: role.description || '' });
        openModal('edit', role);
    };

    const handleDeleteRole = (role) => {
        openModal('delete', role);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'create') {
                await createRole(formData);
            } else {
                await updateRole(modalData.id, formData);
            }
            closeModal();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRole(modalData.id);
            closeModal();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const renderRolesList = () => {
        if (loading) return <LoadingSpinner text="Cargando roles..." />;
        if (error) return <ErrorDisplay error={error} onRetry={refetch} />;

        return (
            <div className="divide-y divide-gray-200">
                {roles.map((role) => (
                    <RoleItem
                        key={role}
                        role={role}
                        onEdit={() => handleEditRole({ name: role, id: role })}
                        onDelete={() => handleDeleteRole({ name: role, id: role })}
                    />
                ))}
            </div>
        );
    };

    const renderModal = () => {
        const modalProps = {
            show: showModal,
            onClose: closeModal,
            size: "max-w-md"
        };

        switch (modalType) {
            case 'create':
                return (
                    <Modal {...modalProps} title="Crear Rol" icon={<Plus />}>
                        <RoleForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            onCancel={closeModal}
                        />
                    </Modal>
                );
            case 'edit':
                return (
                    <Modal {...modalProps} title="Editar Rol" icon={<Edit />}>
                        <RoleForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            onCancel={closeModal}
                        />
                    </Modal>
                );
            case 'delete':
                return (
                    <Modal {...modalProps} title="Eliminar Rol" icon={<Trash2 />}>
                        <DeleteConfirmation
                            itemName={modalData?.name}
                            itemType="rol"
                            onConfirm={handleDelete}
                            onCancel={closeModal}
                        />
                    </Modal>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                icon={{
                    component: <Shield />,
                    bgColor: "bg-purple-600"
                }}
                title="Gestión de Roles"
                subtitle="Administra los roles y permisos del sistema"
                actionButton={
                    <button
                        onClick={handleCreateRole}
                        className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                    >
                        <Plus size={20} />
                        <span>Nuevo Rol</span>
                    </button>
                }
            />

            <div className="rounded-lg bg-white shadow-lg dark:bg-secundario-dark">
                {renderRolesList()}
            </div>

            {renderModal()}
        </div>
    );
};

// Componente separado para cada item de rol
const RoleItem = ({ role, onEdit, onDelete }) => {
    const isSystemRole = ['Administrador', 'Registrado'].includes(role);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-purple-100 p-3">
                        <Shield className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-texto text-lg font-semibold dark:text-texto-dark">
                            {role}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Rol del sistema FilmWhere
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onEdit}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
                        title="Editar rol"
                    >
                        <Edit size={16} />
                    </button>
                    {!isSystemRole && (
                        <button
                            onClick={onDelete}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-900"
                            title="Eliminar rol"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRoles;