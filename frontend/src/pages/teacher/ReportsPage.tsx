import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  CreditCard,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import exportService, { type ExportOptions as ServiceExportOptions } from '../../services/exportService';
import ReportCard from '../../components/features/reports/ReportCard';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeStats?: boolean;
}

const ReportsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleExport = async (reportType: string, options: ExportOptions) => {
    setIsLoading(true);
    try {
      const exportOptions: ServiceExportOptions = {
        format: options.format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(options.includeStats && { includeStats: true })
      };

      switch (reportType) {
        case 'students':
          await exportService.exportStudents(exportOptions);
          break;
        case 'payments':
          await exportService.exportPayments(exportOptions);
          break;
        case 'time-entries':
          await exportService.exportTimeEntries(exportOptions);
          break;
        case 'attendance':
          await exportService.exportAttendance(exportOptions);
          break;
        case 'expenses':
          await exportService.exportExpenses(exportOptions);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reportCards = [
    {
      id: 'students',
      title: 'Students Report',
      description: 'Export comprehensive student data including personal info, academic details, and payment status',
      icon: Users,
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      includeStats: true
    },
    {
      id: 'payments',
      title: 'Payments Report',
      description: 'Export payment history and transaction details for the selected date range',
      icon: CreditCard,
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      includeStats: false
    },
    {
      id: 'time-entries',
      title: 'Time Entries Report',
      description: 'Export logged teaching hours and session details',
      icon: Clock,
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      includeStats: false
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Export student attendance records and statistics',
      icon: Calendar,
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-600',
      includeStats: false
    },
    {
      id: 'expenses',
      title: 'Expenses Report',
      description: 'Export business expenses and cost tracking data',
      icon: TrendingUp,
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      includeStats: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate and download comprehensive reports for your teaching data
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setDateRange({
              startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0]
            })}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Dates
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Date Range Filter</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportCards.map((report) => (
          <ReportCard
            key={report.id}
            id={report.id}
            title={report.title}
            description={report.description}
            icon={report.icon}
            color={report.color}
            iconColor={report.iconColor}
            isLoading={isLoading}
            onExport={(format) => handleExport(report.id, { 
              format, 
              includeStats: report.includeStats 
            })}
          />
        ))}
      </div>

      {/* Export Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Export Guidelines</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>CSV:</strong> Best for data analysis and spreadsheet import</p>
          <p>• <strong>Excel:</strong> Formatted spreadsheet with charts and styling</p>
          <p>• <strong>PDF:</strong> Professional reports suitable for printing and sharing</p>
          <p>• Reports are filtered by the selected date range (where applicable)</p>
          <p>• Large datasets may take a few moments to generate</p>
          <p>• All exports include your current student and session data</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('students', { format: 'pdf', includeStats: true })}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4 mr-2" />
            Student Summary PDF
          </button>
          
          <button
            onClick={() => handleExport('payments', { format: 'excel' })}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Monthly Payments
          </button>
          
          <button
            onClick={() => handleExport('time-entries', { format: 'csv' })}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-4 h-4 mr-2" />
            Time Tracking CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
