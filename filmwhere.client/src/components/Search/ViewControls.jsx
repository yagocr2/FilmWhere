// components/ViewControls.jsx
import { Grid, List } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ViewControls = ({
    viewMode,
    onViewModeChange,
    currentPage,
    totalPages,
    isSearching = false
}) => {
    const { theme } = useTheme();

    const getButtonClass = (mode) => {
        const isActive = viewMode === mode;
        return `p-2 rounded-md transition-all duration-300 ${isActive
            ? theme === 'dark'
                ? 'bg-primario text-texto'
                : 'bg-primario-dark text-texto-dark'
            : theme === 'dark'
                ? 'bg-secundario-dark text-texto-dark hover:bg-primario hover:text-texto'
                : 'bg-secundario text-texto hover:bg-primario-dark hover:text-texto-dark'
            }`;
    };

    const displayTotalPages = isSearching ? Math.min(totalPages, 2) : totalPages;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onViewModeChange('grid')}
                    className={getButtonClass('grid')}
                    title="Vista en cuadrícula"
                >
                    <Grid size={20} />
                </button>
                <button
                    onClick={() => onViewModeChange('list')}
                    className={getButtonClass('list')}
                    title="Vista en lista"
                >
                    <List size={20} />
                </button>
            </div>

            <p className="text-sm opacity-70">
                Página {currentPage} de {displayTotalPages}
                {isSearching && ' (máximo 2 páginas en búsquedas)'}
            </p>
        </div>
    );
};

export default ViewControls;