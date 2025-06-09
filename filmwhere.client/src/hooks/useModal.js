import { useState } from 'react';

// Hook para modales genéricos
export const useModal = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalData, setModalData] = useState(null);

    const openModal = (type, data = null) => {
        setModalType(type);
        setModalData(data);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setModalData(null);
    };

    return {
        showModal,
        modalType,
        modalData,
        openModal,
        closeModal
    };
};