import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/ui/ToastContext';

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
    totalAmount?: number;
  };
  pendingExpenseApprovals: {
    count: number;
    totalAmount: number;
  };
}

interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
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
  monthlyRevenue: 0,
  monthlyHours: 0
};

const initialPendingActions: PendingActions = {
  pendingTeacherApprovals: {
    count: 0,
    totalAmount: 0
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
  const toast = useToast();

  // Fetch dashboard statistics
  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        setIsLoading(prev => ({ ...prev, stats: true }));
        setError(prev => ({ ...prev, stats: null }));
        
        const response = await api.get('/dashboard/stats', { signal: controller.signal });
        
        if (response.data && response.data.success) {
          const { totalTeachers, totalStudents, monthlyRevenue, monthlyHours, lastUpdated } = response.data.data;
          
          setStats({
            totalTeachers: totalTeachers || 0,
            totalStudents: totalStudents || 0,
            monthlyRevenue: monthlyRevenue || 0,
            monthlyHours: monthlyHours || 0,
            lastUpdated: lastUpdated ? new Date(lastUpdated) : undefined
          });
        } else {
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          // request was cancelled; do nothing
          return;
        }
        console.error('Failed to fetch dashboard stats:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          stats: errMessage || 'Failed to load dashboard statistics'
        }));
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchStats();

    return () => {
      controller.abort();
    };
  }, [refreshTrigger, toast]);

  // Fetch recent activities
  useEffect(() => {
    const controller = new AbortController();

    const fetchActivities = async () => {
      try {
        setIsLoading(prev => ({ ...prev, activities: true }));
        setError(prev => ({ ...prev, activities: null }));
        
        // Request only top 5 activities to reduce payload (backend should support this)
        const response = await api.get('/dashboard/activities?limit=5', { signal: controller.signal });
        
        if (response.data && response.data.success) {
          setActivities(response.data.data || []);
        } else {
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          return;
        }
        console.error('Failed to fetch activities:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          activities: errMessage || 'Failed to load recent activities'
        }));
        toast.error('Failed to load recent activities');
      } finally {
        setIsLoading(prev => ({ ...prev, activities: false }));
      }
    };

    fetchActivities();

    return () => {
      controller.abort();
    };
  }, [refreshTrigger, toast]);

  // Fetch pending actions
  useEffect(() => {
    const controller = new AbortController();

    const fetchPendingActions = async () => {
      try {
        setIsLoading(prev => ({ ...prev, pendingActions: true }));
        setError(prev => ({ ...prev, pendingActions: null }));
        
        const response = await api.get('/dashboard/pending-actions', { signal: controller.signal });
        
        if (response.data && response.data.success) {
          setPendingActions(response.data.data || initialPendingActions);
        } else {
          throw new Error(response.data?.message || 'Invalid response from server');
        }
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          return;
        }
        console.error('Failed to fetch pending actions:', err);
        const errMessage = err instanceof Error ? err.message : String(err);
        setError(prev => ({
          ...prev,
          pendingActions: errMessage || 'Failed to load pending actions'
        }));
        toast.error('Failed to load pending actions');
      } finally {
        setIsLoading(prev => ({ ...prev, pendingActions: false }));
      }
    };

    fetchPendingActions();

    return () => {
      controller.abort();
    };
  }, [refreshTrigger, toast]);

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
