import { useState, useEffect } from 'react';
import api from '../services/api';

interface PeriodStats {
  hours: number;
  earnings: number;
}

interface TeacherDashboardStats {
  myStudents: number;
  dailyStats: PeriodStats;
  weeklyStats: PeriodStats;
  monthlyStats: PeriodStats;
  avgRate: number;
  recentEntries: RecentTimeEntry[];
  // Legacy fields for backwards compatibility
  weeklyHours: number;
  monthlyEarnings: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

interface RecentTimeEntry {
  id: string;
  className: string;
  hours: number;
  amount: number;
  date: string;
  dateString: string;
}

const initialStats: TeacherDashboardStats = {
  myStudents: 0,
  dailyStats: { hours: 0, earnings: 0 },
  weeklyStats: { hours: 0, earnings: 0 },
  monthlyStats: { hours: 0, earnings: 0 },
  avgRate: 0,
  recentEntries: [],
  weeklyHours: 0,
  monthlyEarnings: 0,
  isLoading: true,
  error: null
};

export const useTeacherDashboardStats = () => {
  const [stats, setStats] = useState<TeacherDashboardStats>(initialStats);

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await api.get('/dashboard/teacher-stats');
      
      if (response.data && response.data.success) {
        const { 
          myStudents, 
          dailyStats,
          weeklyStats,
          monthlyStats,
          avgRate, 
          recentEntries,
          // Legacy fields
          weeklyHours, 
          monthlyEarnings, 
          lastUpdated 
        } = response.data.data;
        
        setStats({
          myStudents: myStudents || 0,
          dailyStats: dailyStats || { hours: 0, earnings: 0 },
          weeklyStats: weeklyStats || { hours: 0, earnings: 0 },
          monthlyStats: monthlyStats || { hours: 0, earnings: 0 },
          avgRate: avgRate || 0,
          recentEntries: recentEntries || [],
          weeklyHours: weeklyHours || 0,
          monthlyEarnings: monthlyEarnings || 0,
          lastUpdated: lastUpdated ? new Date(lastUpdated) : undefined,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch teacher dashboard stats:', err);
      const errMessage = err instanceof Error ? err.message : String(err);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: errMessage || 'Failed to load dashboard statistics. Please try again.'
      }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { ...stats, refetch: fetchStats };
};

export default useTeacherDashboardStats;
