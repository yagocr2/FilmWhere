// components/ProfileStats.jsx
import React from 'react';
import { MessageSquare, Heart, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const StatCard = ({ icon: Icon, value, label, iconColor, theme }) => (
    <div className={`rounded-lg p-6 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
        <Icon size={32} className={`mx-auto mb-2 ${iconColor}`} />
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm opacity-70">{label}</p>
    </div>
);

const ProfileStats = ({ userReviews, favoritesMetadata }) => {
    const { theme } = useTheme();

    const averageRating = userReviews.length > 0
        ? (userReviews.reduce((sum, review) => sum + review.calificacion, 0) / userReviews.length).toFixed(1)
        : '0.0';

    const stats = [
        {
            icon: MessageSquare,
            value: userReviews.length,
            label: 'Reseñas escritas',
            iconColor: 'text-blue-500'
        },
        {
            icon: Heart,
            value: favoritesMetadata.totalCount,
            label: 'Películas favoritas',
            iconColor: 'text-red-500'
        },
        {
            icon: Star,
            value: averageRating,
            label: 'Calificación promedio',
            iconColor: 'text-yellow-500'
        }
    ];

    return (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    icon={stat.icon}
                    value={stat.value}
                    label={stat.label}
                    iconColor={stat.iconColor}
                    theme={theme}
                />
            ))}
        </div>
    );
};

export default ProfileStats;