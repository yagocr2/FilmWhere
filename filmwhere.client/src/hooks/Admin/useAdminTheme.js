import { useTheme } from '../../context/ThemeContext';

// Hook para temas compartido
export const useAdminTheme = () => {
    const { theme } = useTheme();

    return {
        cardBgClass: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
        textClass: theme === 'dark' ? 'text-texto-dark' : 'text-texto',
        textSecondaryClass: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
        inputBgClass: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
        borderClass: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
        hoverClass: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
    };
};