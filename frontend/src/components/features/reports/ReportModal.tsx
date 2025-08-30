import React from 'react';
import { X, Download, Calendar, DollarSign, Clock, FileText, TrendingUp } from 'lucide-react';
import type { TimeEntry, Expense, Payment, EarningsSummaryResponse } from '../../../types/financial';
import { formatCurrency as formatCurrencyUtil } from '../../../utils/currency';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reportType: 'monthly' | 'payments' | 'earnings';
  data: {
    timeEntries?: TimeEntry[];
    expenses?: Expense[];
    payments?: Payment[];
    earningsSummary?: EarningsSummaryResponse;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
  onExport: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  reportType,
  data,
  onExport
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const renderMonthlyReport = () => {
    const totalEarnings = data.timeEntries?.reduce((sum, entry) => sum + entry.totalAmount, 0) || 0;
    const totalExpenses = data.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalHours = data.timeEntries?.reduce((sum, entry) => sum + entry.hoursWorked, 0) || 0;
    const netIncome = totalEarnings - totalExpenses;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-700">Total Earnings</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-lg font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-700">Total Hours</p>
                <p className="text-lg font-bold text-blue-900">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-700">Net Income</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(netIncome)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Earnings */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Earnings</h4>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Class</th>
                    <th className="px-4 py-2 text-left">Hours</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeEntries?.slice(0, 10).map((entry) => (
                    <tr key={entry._id} className="border-t">
                      <td className="px-4 py-2">{formatDate(entry.date)}</td>
                      <td className="px-4 py-2">{entry.classId.name}</td>
                      <td className="px-4 py-2">{entry.hoursWorked}</td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(entry.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Expenses</h4>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses?.slice(0, 10).map((expense) => (
                    <tr key={expense._id} className="border-t">
                      <td className="px-4 py-2">{formatDate(expense.date)}</td>
                      <td className="px-4 py-2">{expense.category}</td>
                      <td className="px-4 py-2">{expense.description}</td>
                      <td className="px-4 py-2 font-medium text-red-600">-{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentsReport = () => {
    const totalPayments = data.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const completedPayments = data.payments?.filter(p => p.status === 'completed') || [];
    const pendingPayments = data.payments?.filter(p => p.status === 'pending') || [];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-700">Total Payments</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(totalPayments)}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-600 rounded-full mr-2"></div>
              <div>
                <p className="text-sm text-green-700">Completed</p>
                <p className="text-lg font-bold text-green-900">{completedPayments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-600 rounded-full mr-2"></div>
              <div>
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-lg font-bold text-yellow-900">{pendingPayments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h4>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Method</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments?.map((payment) => (
                    <tr key={payment._id} className="border-t">
                      <td className="px-4 py-2">{formatDate(payment.paymentDate)}</td>
                      <td className="px-4 py-2">{payment.studentId.firstName} {payment.studentId.lastName}</td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-2 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEarningsReport = () => {
    const summary = data.earningsSummary?.summary;
    const breakdown = data.earningsSummary?.breakdown || [];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-700">Total Earnings</p>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(summary.totalEarnings)}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-blue-700">Total Hours</p>
                  <p className="text-lg font-bold text-blue-900">{summary.totalHours.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-purple-700">Avg. Rate</p>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(summary.averageHourlyRate)}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm text-orange-700">Entries</p>
                  <p className="text-lg font-bold text-orange-900">{summary.entryCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Breakdown by Class */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Earnings by Class</h4>
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Class</th>
                    <th className="px-4 py-2 text-left">Hours</th>
                    <th className="px-4 py-2 text-left">Earnings</th>
                    <th className="px-4 py-2 text-left">Avg. Rate</th>
                    <th className="px-4 py-2 text-left">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item) => (
                    <tr key={item._id.classId} className="border-t">
                      <td className="px-4 py-2 font-medium">{item._id.name}</td>
                      <td className="px-4 py-2">{item.totalHours.toFixed(1)}</td>
                      <td className="px-4 py-2 font-medium text-green-600">{formatCurrency(item.totalEarnings)}</td>
                      <td className="px-4 py-2">{formatCurrency(item.averageHourlyRate)}</td>
                      <td className="px-4 py-2">{item.entryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (reportType) {
      case 'monthly':
        return renderMonthlyReport();
      case 'payments':
        return renderPaymentsReport();
      case 'earnings':
        return renderEarningsReport();
      default:
        return <div>Report type not supported</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {data.dateRange && (
              <p className="text-sm text-gray-600 mt-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {formatDate(data.dateRange.startDate)} - {formatDate(data.dateRange.endDate)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onExport}
              className="btn btn-primary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
