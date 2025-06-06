import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const MovieSection = ({ title, icon: Icon, children }) => {
    const { theme } = useTheme();

    return (
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <h3 className="mb-4 flex items-center text-xl font-semibold">
                {Icon && <Icon className="mr-2" />}
                {title}
            </h3>
            {children}
        </div>
    );
};

export default MovieSection;