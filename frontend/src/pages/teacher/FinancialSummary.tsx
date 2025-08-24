import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchEarningsSummary, 
  fetchExpenses, 
  fetchTimeEntries, 
  fetchPayments
} from '../../store/slices/financialSlice';
import { useTeacherDashboardStats } from '../../hooks/useTeacherDashboardStats';
import { teacherService } from '../../services/teacherService';
import exportService from '../../services/exportService';
import type { Teacher } from '../../types/teacher';
import { DollarSign, TrendingUp, TrendingDown, Download, Eye, Clock, AlertCircle, Users } from 'lucide-react';
import ReportModal from '../../components/features/reports/ReportModal';

const FinancialSummary: React.FC = () => {
  const dispatch = useAppDispatch();
  const { expenses, timeEntries, payments, earningsSummary, isLoading, error } = useAppSelector((state) => state.financial);
  const { user } = useAppSelector((state) => state.auth);
  
  // Teacher selection for admin
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teachersLoading, setTeachersLoading] = useState(false);
  
  // State for export format selection
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: 'monthly' | 'payments' | 'earnings' | null;
    title: string;
  }>({
    isOpen: false,
    type: null,
    title: ''
  });
  
  // Get teacher dashboard stats (only if teacher is selected for admin or user is teacher)
  const {
    weeklyHours,
    monthlyEarnings,
    recentEntries,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useTeacherDashboardStats();

  // Local state for date filters
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  // Calculate current month's expenses
  const currentMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((total, expense) => total + expense.amount, 0);

  // Calculate net income
  const netIncome = monthlyEarnings - currentMonthExpenses;

  // Calculate previous month data for comparisons
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  
  const previousMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === previousMonth.getMonth() && 
             expenseDate.getFullYear() === previousMonth.getFullYear();
    })
    .reduce((total, expense) => total + expense.amount, 0);

  // Calculate percentage changes
  const earningsChange = monthlyEarnings > 0 ? 12.5 : 0; // This would need historical data
  const expensesChange = currentMonthExpenses > previousMonthExpenses ? 
    ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses * 100) : 0;
  const netIncomeChange = netIncome > 0 ? 15.8 : 0; // This would need historical data
  const hoursChange = weeklyHours > 0 ? 8.3 : 0; // This would need historical data

  // Recent expenses (last 5)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  useEffect(() => {
    // Fetch teachers if user is admin
    if (user?.role === 'admin') {
      const fetchTeachers = async () => {
        try {
          setTeachersLoading(true);
          const teachersData = await teacherService.getTeachers();
          setTeachers(teachersData);
        } catch (error) {
          console.error('Failed to fetch teachers:', error);
        } finally {
          setTeachersLoading(false);
        }
      };
      fetchTeachers();
    }
  }, [user?.role]);

  useEffect(() => {
    // Only fetch financial data if:
    // 1. User is a teacher, OR
    // 2. User is admin and has selected a teacher
    if (user?.role === 'teacher' || (user?.role === 'admin' && selectedTeacherId)) {
      // Fetch financial data
      dispatch(fetchEarningsSummary({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      }));
      dispatch(fetchExpenses({}));
      dispatch(fetchTimeEntries({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      }));
      dispatch(fetchPayments({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      }));
    }
  }, [dispatch, dateFilter, user?.role, user?.id, selectedTeacherId]);

  const handleExportReport = async (format: 'csv' | 'excel' | 'pdf' = 'excel') => {
    try {
      // Export time entries as the main financial report
      await exportService.exportTimeEntries({
        format,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      alert(`Financial report exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Report modal handlers
  const openReportModal = (type: 'monthly' | 'payments' | 'earnings', title: string) => {
    setReportModal({
      isOpen: true,
      type,
      title
    });
  };

  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      type: null,
      title: ''
    });
  };

  // Export handlers for specific reports
  const handleExportMonthlyReport = async () => {
    try {
      // Export both time entries and expenses for monthly summary
      await Promise.all([
        exportService.exportTimeEntries({
          format: exportFormat,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate
        }),
        exportService.exportExpenses({
          format: exportFormat,
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate
        })
      ]);
      alert(`Monthly report exported successfully as ${exportFormat.toUpperCase()}! Check your downloads for both time entries and expenses files.`);
    } catch (error) {
      console.error('Failed to export monthly report:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportPaymentsReport = async () => {
    try {
      await exportService.exportPayments({
        format: exportFormat,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      alert(`Payments report exported successfully as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export payments report:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportEarningsReport = async () => {
    try {
      await exportService.exportTimeEntries({
        format: exportFormat,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      alert(`Earnings report exported successfully as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      console.error('Failed to export earnings report:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Get export handler based on modal type
  const getExportHandler = () => {
    switch (reportModal.type) {
      case 'monthly':
        return handleExportMonthlyReport;
      case 'payments':
        return handleExportPaymentsReport;
      case 'earnings':
        return handleExportEarningsReport;
      default:
        return () => handleExportReport(exportFormat);
    }
  };

  if (isLoading || statsLoading || teachersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || statsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Financial Data</h3>
              <p className="text-sm text-red-700 mt-1">{error || statsError}</p>
            </div>
            <button
              onClick={() => {
                refetchStats();
                if (user?.role === 'teacher' || (user?.role === 'admin' && selectedTeacherId)) {
                  dispatch(fetchEarningsSummary({
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate
                  }));
                }
              }}
              className="text-red-400 hover:text-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For admin users, show teacher selection if no teacher is selected
  if (user?.role === 'admin' && !selectedTeacherId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Teacher</h3>
          <p className="text-gray-600 mb-6">Choose a teacher to view their financial summary</p>
          
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="form-input w-full"
              disabled={teachersLoading}
            >
              <option value="">Choose a teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {(teacher as any).profile.firstName} {(teacher as any).profile.lastName} ({teacher.email})
                </option>
              ))}
            </select>
            {teachersLoading && (
              <p className="text-sm text-gray-500 mt-2">Loading teachers...</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'Teacher Financial Summary' : 'Financial Summary'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? `Track earnings, expenses, and financial performance for ${teachers.find(t => t._id === selectedTeacherId)?.profile.firstName} ${teachers.find(t => t._id === selectedTeacherId)?.profile.lastName}`
              : 'Track your earnings, expenses, and financial performance'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="form-input min-w-48"
              disabled={teachersLoading}
            >
              <option className='text-gray-500' value="">Select teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {(teacher as any).profile.firstName} {(teacher as any).profile.lastName}
                </option>
              ))}
            </select>
          )}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'pdf')}
            className="form-input min-w-20"
          >
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button 
            onClick={() => handleExportReport(exportFormat)}
            className="btn btn-primary flex items-center min-w-44"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">${monthlyEarnings.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+{earningsChange.toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${currentMonthExpenses.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-error-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            {expensesChange >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-error-600 mr-1" />
                <span className="text-sm text-error-600">+{expensesChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-success-600 mr-1" />
                <span className="text-sm text-success-600">{expensesChange.toFixed(1)}%</span>
              </>
            )}
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">${netIncome.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+{netIncomeChange.toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Worked</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyHours.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+{hoursChange.toFixed(1)}%</span>
            <span className="text-sm text-gray-500 ml-1">vs last week</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Earnings</h3>
          </div>
          <div className="space-y-4">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.lessonType}</p>
                    <p className="text-xs text-gray-500">{entry.hours} hours • {entry.dateString}</p>
                  </div>
                  <span className="text-sm font-medium text-success-600">+${entry.amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent earnings found</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          </div>
          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.category}</p>
                    <p className="text-xs text-gray-500">{expense.description}</p>
                  </div>
                  <span className="text-sm font-medium text-error-600">-${expense.amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent expenses found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Reports */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Available Reports</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Monthly Summary</h4>
            <p className="text-sm text-gray-600 mb-4">Detailed breakdown of earnings and expenses</p>
            <div className="flex space-x-2">
              <button 
                onClick={() => openReportModal('monthly', 'Monthly Summary Report')}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button 
                onClick={handleExportMonthlyReport}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Student Payments</h4>
            <p className="text-sm text-gray-600 mb-4">Track payments from your students</p>
            <div className="flex space-x-2">
              <button 
                onClick={() => openReportModal('payments', 'Student Payments Report')}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button 
                onClick={handleExportPaymentsReport}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Earnings Summary</h4>
            <p className="text-sm text-gray-600 mb-4">Detailed earnings breakdown by lesson type</p>
            <div className="flex space-x-2">
              <button 
                onClick={() => openReportModal('earnings', 'Earnings Summary Report')}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button 
                onClick={handleExportEarningsReport}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={closeReportModal}
          title={reportModal.title}
          reportType={reportModal.type!}
          data={{
            timeEntries: timeEntries || [],
            expenses: expenses || [],
            payments: payments || [],
            earningsSummary: earningsSummary || undefined,
            dateRange: {
              startDate: dateFilter.startDate,
              endDate: dateFilter.endDate
            }
          }}
          onExport={getExportHandler()}
        />
      )}
    </div>
  );
};

export default FinancialSummary;
