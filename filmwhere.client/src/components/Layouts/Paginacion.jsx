// components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Pagination = ({ currentPage, totalPages, onPageChange, isSearching = false }) => {
    const { theme } = useTheme();
    const maxPages = isSearching ? 2 : totalPages;

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
            i <= Math.min(maxPages - 1, currentPage + delta);
            i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < maxPages - 1) {
            rangeWithDots.push('...', maxPages);
        } else if (maxPages > 1) {
            rangeWithDots.push(maxPages);
        }

        return rangeWithDots;
    };

    if (maxPages <= 1) return null;

    const buttonClass = `px-3 py-2 rounded-md transition-all duration-300 ${theme === 'dark'
        ? 'bg-gray-700-dark text-texto-dark hover:bg-primario hover:text-texto border-gray-600'
        : 'bg-gray-200 text-texto hover:bg-primario-dark hover:text-texto-dark border-gray-300'
        } border`;

    const activeButtonClass = `px-3 py-2 rounded-md ${theme === 'dark'
        ? 'bg-primario text-texto'
        : 'bg-primario-dark text-texto-dark'
        }`;

    return (
        <div className="mt-8 flex items-center justify-center space-x-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
            >
                <ChevronLeft size={16} />
                <span>Anterior</span>
            </button>

            {getVisiblePages().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                    disabled={page === '...'}
                    className={
                        page === currentPage
                            ? activeButtonClass
                            : page === '...'
                                ? 'px-3 py-2 cursor-default'
                                : buttonClass
                    }
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= maxPages}
                className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1`}
            >
                <span>Siguiente</span>
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;