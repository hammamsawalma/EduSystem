import { useState, useEffect } from 'react';
import api from '../services/api';

interface TeacherDashboardStats {
  myStudents: number;
  weeklyHours: number;
  monthlyEarnings: number;
  avgRate: number;
  recentEntries: RecentTimeEntry[];
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

interface RecentTimeEntry {
  id: string;
  lessonType: string;
  hours: number;
  amount: number;
  date: string;
  dateString: string;
}

const initialStats: TeacherDashboardStats = {
  myStudents: 0,
  weeklyHours: 0,
  monthlyEarnings: 0,
  avgRate: 0,
  recentEntries: [],
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
          weeklyHours, 
          monthlyEarnings, 
          avgRate, 
          recentEntries, 
          lastUpdated 
        } = response.data.data;
        
        setStats({
          myStudents: myStudents || 0,
          weeklyHours: weeklyHours || 0,
          monthlyEarnings: monthlyEarnings || 0,
          avgRate: avgRate || 0,
          recentEntries: recentEntries || [],
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
