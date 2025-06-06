import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ListaPlataformas = ({ platforms }) => {
    const { theme } = useTheme();

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform, index) => (
                <div
                    key={index}
                    className={`p-4 rounded-lg border transition-colors ${theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">{platform.name}</h4>
                            <p className="text-sm text-gray-500">{platform.type}</p>
                        </div>
                        {platform.price > 0 && (
                            <span className="font-bold text-green-500">
                                ${platform.price}
                            </span>
                        )}
                    </div>
                    {platform.url && (
                        <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-block text-sm underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                }`}
                        >
                            Ver en {platform.name}
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ListaPlataformas;