import { useState, useEffect } from 'react';
import api from '../services/api';

interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  monthlyRevenue: number;
  monthlyHours: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

const initialStats: DashboardStats = {
  totalTeachers: 0,
  totalStudents: 0,
  monthlyRevenue: 0,
  monthlyHours: 0,
  isLoading: true,
  error: null
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Real API call to fetch dashboard statistics
        const response = await api.get('/dashboard/stats');
        
        if (response.data && response.data.success) {
          const { totalTeachers, totalStudents, monthlyRevenue, monthlyHours, lastUpdated } = response.data.data;
          
          setStats({
            totalTeachers: totalTeachers || 0,
            totalStudents: totalStudents || 0,
            monthlyRevenue: monthlyRevenue || 0,
            monthlyHours: monthlyHours || 0,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : undefined,
            isLoading: false,
            error: null
          });
        } else {
          // API returned error or malformed data
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard stats:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: errMessage || 'Failed to load dashboard statistics. Please try again.'
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};

export default useDashboardStats;
