import { useState, useEffect } from 'react';

// Hook para estadísticas del dashboard
export const useAdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [denuncias, setDenuncias] = useState(null);

    const fetchEstadisticas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/estadisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };
    const fetchDenuncias = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/denuncias', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Error al cargar las denuncias');
            }
            const data = await response.json();
            console.log(data);
            setDenuncias(data);
        } catch (err) {
            setError(err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEstadisticas();
        fetchDenuncias();
    }, []);

    return { stats, denuncias, loading, error, refetch: (fetchEstadisticas, fetchDenuncias) };
};

