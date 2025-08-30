import { useState, useEffect } from 'react';
import api from '../services/api';

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  targetType: string;
  details: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface PendingActions {
  pendingTeacherApprovals: {
    count: number;
  };
  pendingExpenseApprovals: {
    count: number;
    totalAmount: number;
  };
}

interface PeriodStats {
  hours: number;
  revenue: number;
}

interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  dailyStats: PeriodStats;
  weeklyStats: PeriodStats;
  monthlyStats: PeriodStats;
  // Legacy fields for backwards compatibility
  monthlyRevenue: number;
  monthlyHours: number;
  lastUpdated?: Date;
}

interface AdminDashboardData {
  stats: DashboardStats;
  activities: Activity[];
  pendingActions: PendingActions;
  isLoading: {
    stats: boolean;
    activities: boolean;
    pendingActions: boolean;
  };
  error: {
    stats: string | null;
    activities: string | null;
    pendingActions: string | null;
  };
  refetch: () => void;
}

const initialStats: DashboardStats = {
  totalTeachers: 0,
  totalStudents: 0,
  dailyStats: { hours: 0, revenue: 0 },
  weeklyStats: { hours: 0, revenue: 0 },
  monthlyStats: { hours: 0, revenue: 0 },
  monthlyRevenue: 0,
  monthlyHours: 0
};

const initialPendingActions: PendingActions = {
  pendingTeacherApprovals: {
    count: 0
  },
  pendingExpenseApprovals: {
    count: 0,
    totalAmount: 0
  }
};

export const useAdminDashboard = (): AdminDashboardData => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActions>(initialPendingActions);
  const [isLoading, setIsLoading] = useState({
    stats: true,
    activities: true,
    pendingActions: true
  });
  const [error, setError] = useState({
    stats: null as string | null,
    activities: null as string | null,
    pendingActions: null as string | null
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(prev => ({ ...prev, stats: true }));
        setError(prev => ({ ...prev, stats: null }));
        
        const response = await api.get('/dashboard/stats');
        
        if (response.data && response.data.success) {
          const { 
            totalTeachers, 
            totalStudents, 
            dailyStats, 
            weeklyStats, 
            monthlyStats,
            monthlyRevenue, 
            monthlyHours, 
            lastUpdated 
          } = response.data.data;
          
          setStats({
            totalTeachers: totalTeachers || 0,
            totalStudents: totalStudents || 0,
            dailyStats: dailyStats || { hours: 0, revenue: 0 },
            weeklyStats: weeklyStats || { hours: 0, revenue: 0 },
            monthlyStats: monthlyStats || { hours: 0, revenue: 0 },
            monthlyRevenue: monthlyRevenue || 0,
            monthlyHours: monthlyHours || 0,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : undefined
          });
        } else {
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard stats:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          stats: errMessage || 'Failed to load dashboard statistics'
        }));
      } finally {
        setIsLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  // Fetch recent activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(prev => ({ ...prev, activities: true }));
        setError(prev => ({ ...prev, activities: null }));
        
        console.log('Fetching activities...');
        const response = await api.get('/dashboard/activities');
        console.log('Activities response:', response);
        
        if (response.data && response.data.success) {
          console.log('Setting activities:', response.data.data);
          setActivities(response.data.data || []);
        } else {
          console.error('Invalid activities response:', response.data);
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch activities:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          activities: errMessage || 'Failed to load recent activities'
        }));
      } finally {
        setIsLoading(prev => ({ ...prev, activities: false }));
      }
    };

    fetchActivities();
  }, [refreshTrigger]);

  // Fetch pending actions
  useEffect(() => {
    const fetchPendingActions = async () => {
      try {
        setIsLoading(prev => ({ ...prev, pendingActions: true }));
        setError(prev => ({ ...prev, pendingActions: null }));
        
        console.log('Fetching pending actions...');
        const response = await api.get('/dashboard/pending-actions');
        console.log('Pending actions response:', response);
        
        if (response.data && response.data.success) {
          console.log('Setting pending actions:', response.data.data);
          setPendingActions(response.data.data || initialPendingActions);
        } else {
          console.error('Invalid pending actions response:', response.data);
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch pending actions:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          pendingActions: errMessage || 'Failed to load pending actions'
        }));
      } finally {
        setIsLoading(prev => ({ ...prev, pendingActions: false }));
      }
    };

    fetchPendingActions();
  }, [refreshTrigger]);

  // Function to refetch all data
  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    stats,
    activities,
    pendingActions,
    isLoading,
    error,
    refetch
  };
};

export default useAdminDashboard;
