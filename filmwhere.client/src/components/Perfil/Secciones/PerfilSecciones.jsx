// components/ProfileTabs.jsx
import React from 'react';
import { MessageSquare, Heart } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const ProfileTabs = ({ activeTab, setActiveTab }) => {
    const { theme } = useTheme();

    const tabClasses = (tabName) => `
        px-4 py-2 font-medium rounded-lg transition-colors flex items-center space-x-2
        ${activeTab === tabName
            ? theme === 'dark'
                ? 'bg-primario text-texto'
                : 'bg-primario-dark text-texto-dark'
            : theme === 'dark'
                ? 'text-texto-dark hover:bg-gray-700'
                : 'text-texto hover:bg-gray-100'
        }
    `;

    const tabs = [
        { id: 'reseñas', label: 'Mis Reseñas', icon: MessageSquare },
        { id: 'favoritos', label: 'Favoritos', icon: Heart }
    ];

    return (
        <div className="mb-6 flex space-x-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={tabClasses(tab.id)}
                >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ProfileTabs;