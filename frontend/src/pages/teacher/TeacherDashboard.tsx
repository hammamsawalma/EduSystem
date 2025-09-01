import React from 'react';
import { Users, DollarSign, Clock, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherDashboardStats } from '../../hooks/useTeacherDashboardStats';
import { formatCurrency } from '../../utils/currency';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    myStudents, 
    dailyStats,
    weeklyStats,
    monthlyStats,
    avgRate, 
    recentEntries, 
    isLoading, 
    error 
  } = useTeacherDashboardStats();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your teaching activities</p>
        </div>
        <div className="card">
          <div className="p-6 text-center">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your teaching activities</p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : myStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-md flex items-center justify-center">
                <Clock className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : `${weeklyStats.hours}h`}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatCurrency(monthlyStats.earnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-error-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-error-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatCurrency(avgRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Daily Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Today</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Hours</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{dailyStats.hours}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Earnings</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(dailyStats.earnings)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Hours</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{weeklyStats.hours}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Earnings</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(weeklyStats.earnings)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Hours</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{monthlyStats.hours}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="ml-2 text-sm text-gray-600">Earnings</span>
              </div>
              {isLoading ? (
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyStats.earnings)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/students')}
              className="btn btn-primary flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              View Students
            </button>
            <button 
              onClick={() => navigate('/time-tracking')}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Log Time
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="btn btn-success flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </button>
            <button 
              onClick={() => navigate('/financial')}
              className="btn btn-warning flex items-center justify-center"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Financial
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.className}</p>
                    <p className="text-xs text-gray-500">
                      {entry.hours} hours • {formatCurrency(entry.amount)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{entry.dateString}</span>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-gray-500">
                <p>No time entries found</p>
                <p className="text-xs mt-1">Start tracking your time to see entries here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
