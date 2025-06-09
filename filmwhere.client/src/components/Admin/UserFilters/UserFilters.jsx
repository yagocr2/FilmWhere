import React from 'react';
import { SearchBar } from '../../../components/Admin/AdminComponents';

const UserFilters = ({
    searchTerm,
    onSearch,
    pageSize,
    onPageSizeChange,
    cardBgClass,
    textClass,
    textSecondaryClass,
    inputBgClass,
    borderClass
}) => {
    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6`}>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <SearchBar
                    searchTerm={searchTerm}
                    onSearch={onSearch}
                    placeholder="Buscar usuarios..."
                />
                <PageSizeSelector
                    pageSize={pageSize}
                    onPageSizeChange={onPageSizeChange}
                    textSecondaryClass={textSecondaryClass}
                    inputBgClass={inputBgClass}
                    textClass={textClass}
                    borderClass={borderClass}
                />
            </div>
        </div>
    );
};

const PageSizeSelector = ({
    pageSize,
    onPageSizeChange,
    textSecondaryClass,
    inputBgClass,
    textClass,
    borderClass
}) => {
    return (
        <div className="flex items-center space-x-2">
            <span className={`${textSecondaryClass} text-sm`}>Mostrar:</span>
            <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className={`${inputBgClass} ${textClass} ${borderClass} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </select>
        </div>
    );
};

export default UserFilters;