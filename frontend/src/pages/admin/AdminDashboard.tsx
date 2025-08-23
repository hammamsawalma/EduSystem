import React from 'react';
import { Users, DollarSign, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAdminDashboard from '../../hooks/useAdminDashboard';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../components/ui/ToastContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    stats: { totalTeachers, totalStudents, monthlyRevenue, monthlyHours },
    activities,
    pendingActions,
    isLoading,
    error
  , refetch } = useAdminDashboard();
  const toast = useToast();
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your education system</p>
        </div>
        <div>
          <button
            onClick={() => {
              toast.info('Refreshing...');
              refetch();
            }}
            className="btn btn-sm btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {error.stats && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error.stats}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              {isLoading.stats ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              {isLoading.stats ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              {isLoading.stats ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-error-100 rounded-md flex items-center justify-center">
                <Clock className="w-5 h-5 text-error-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hours This Month</p>
              {isLoading.stats ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{monthlyHours.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="space-y-4">
            {isLoading.activities ? (
              <>
                <div className="h-12 bg-gray-100 animate-pulse rounded mb-2"></div>
                <div className="h-12 bg-gray-100 animate-pulse rounded mb-2"></div>
                <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
              </>
            ) : error.activities ? (
              <div className="text-error-500 text-sm">
                {error.activities}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-gray-500 text-sm py-2">
                No recent activities found
              </div>
            ) : (
              activities.slice(0, 5).map((activity) => {
                // Determine color based on activity type
                let dotColor = "bg-primary-500";
                if (activity.targetType === 'user') dotColor = "bg-success-500";
                if (activity.targetType === 'expense') dotColor = "bg-warning-500";
                if (activity.targetType === 'payment') dotColor = "bg-error-500";
                
                return (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Pending Actions</h3>
          </div>
          <div className="space-y-4">
            {isLoading.pendingActions ? (
              <>
                <div className="h-16 bg-gray-100 animate-pulse rounded mb-2"></div>
                <div className="h-16 bg-gray-100 animate-pulse rounded"></div>
              </>
            ) : error.pendingActions ? (
              <div className="text-error-500 text-sm">
                {error.pendingActions}
              </div>
            ) : (
              <>
                {pendingActions.pendingTeacherApprovals.count > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-warning-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pendingActions.pendingTeacherApprovals.count} Teacher {pendingActions.pendingTeacherApprovals.count === 1 ? 'Approval' : 'Approvals'}
                        </p>
                        <p className="text-xs text-gray-500">Pending your review</p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => navigate('/teachers')}
                    >
                      Review
                    </button>
                  </div>
                )}
                
                {pendingActions.pendingExpenseApprovals.count > 0 && (
                  <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-error-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pendingActions.pendingExpenseApprovals.count} Expense {pendingActions.pendingExpenseApprovals.count === 1 ? 'Approval' : 'Approvals'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Total: {formatCurrency(pendingActions.pendingExpenseApprovals.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-error btn-sm"
                      onClick={() => navigate('/financial')}
                    >
                      Review
                    </button>
                  </div>
                )}
                
                {pendingActions.pendingTeacherApprovals.count === 0 && 
                 pendingActions.pendingExpenseApprovals.count === 0 && (
                  <div className="text-gray-500 text-sm py-2">
                    No pending actions found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
