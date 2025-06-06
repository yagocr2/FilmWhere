// components/SearchBar.jsx
import { Search as SearchIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const BarraBusqueda = ({
    searchTerm,
    onSearchTermChange,
    onSubmit,
    onClear,
    isSearching = false
}) => {
    const { theme } = useTheme();

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex space-x-2">
                <div className="relative flex-1">
                    <SearchIcon
                        className="-translate-y-1/2 absolute left-3 top-1/2 transform text-black dark:text-white"
                        size={20}
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        placeholder="Buscar películas..."
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === 'dark'
                            ? 'bg-gray-800 border-gray-600 text-texto-dark placeholder-gray-400'
                            : 'bg-gray-100 border-gray-300 text-texto placeholder-gray-500'
                            } focus:ring-2 focus:ring-primario focus:border-transparent`}
                    />
                </div>
                <button
                    type="submit"
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${theme === 'dark'
                        ? 'bg-primario text-texto hover:bg-primario-dark hover:text-texto-dark'
                        : 'bg-primario-dark text-texto-dark hover:bg-primario hover:text-texto'
                        }`}
                >
                    Buscar
                </button>
                {isSearching && (
                    <button
                        type="button"
                        onClick={onClear}
                        className={`px-4 py-3 rounded-lg border transition-all duration-300 ${theme === 'dark'
                            ? 'border-gray-600 text-gray-400 hover:text-texto-dark hover:border-gray-400'
                            : 'border-gray-300 text-gray-600 hover:text-texto hover:border-gray-500'
                            }`}
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </form>
    );
};

export default BarraBusqueda;