import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { accountingService } from '../../../services/accountingService';

interface DateRange {
  start: string;
  end: string;
}

interface ProfitLossData {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    studentPayments: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    teacherPayments: number;
    generalExpenses: number;
    breakdown: Array<{
      _id: string;
      total: number;
      count: number;
    }>;
    total: number;
  };
  netIncome: number;
  profitMargin: number;
  status: 'profit' | 'loss' | 'breakeven';
  metrics: {
    revenueCount: number;
    teacherPaymentCount: number;
    generalExpenseCount: number;
  };
}

interface ProfitLossTabProps {
  dateRange: DateRange;
}

const ProfitLossTab: React.FC<ProfitLossTabProps> = ({ dateRange }) => {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfitLossData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingService.getProfitLossSummary({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching profit loss data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);  useEffect(() => {
    fetchProfitLossData();
  }, [fetchProfitLossData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'profit': return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'loss': return <TrendingDown className="h-6 w-6 text-red-600" />;
      default: return <DollarSign className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'profit': return 'text-green-600';
      case 'loss': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
        <p className="text-gray-600 mt-2">
          {new Date(data.period.start).toLocaleDateString()} - {new Date(data.period.end).toLocaleDateString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(data.revenue.total)}</p>
              <p className="text-sm text-gray-500 mt-1">{data.metrics.revenueCount} transactions</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(data.expenses.total)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.metrics.teacherPaymentCount + data.metrics.generalExpenseCount} transactions
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className={`text-3xl font-bold ${getStatusColor(data.status)}`}>
                {formatCurrency(data.netIncome)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(data.status)}
                <span className={`text-sm font-medium capitalize ${getStatusColor(data.status)}`}>
                  {data.status}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {getStatusIcon(data.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Revenue Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Student Payments</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(data.revenue.studentPayments)}
              </span>
            </div>
            
            {data.revenue.otherIncome > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Other Income</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(data.revenue.otherIncome)}
                </span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Revenue</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(data.revenue.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-600" />
            Expenses Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Teacher Payments</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(data.expenses.teacherPayments)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">General Expenses</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(data.expenses.generalExpenses)}
              </span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Expenses</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(data.expenses.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Expenses Categories */}
      {data.expenses.breakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Expenses by Category</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.expenses.breakdown.map((category) => (
              <div key={category._id} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 capitalize">{category._id}</h4>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(category.total)}</p>
                <p className="text-xs text-gray-500">{category.count} transactions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profit Margin Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Profit Margin</p>
            <p className={`text-2xl font-bold ${getStatusColor(data.status)}`}>
              {data.profitMargin.toFixed(1)}%
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Expense Ratio</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.revenue.total > 0 ? ((data.expenses.total / data.revenue.total) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Revenue Growth</p>
            <p className="text-2xl font-bold text-blue-600">
              -% {/* This would need historical data */}
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {data.status === 'profit' && (
              <li>• Business is profitable with {data.profitMargin.toFixed(1)}% profit margin</li>
            )}
            {data.status === 'loss' && (
              <li>• Business is operating at a loss. Consider cost reduction or revenue increase</li>
            )}
            <li>• Teacher payments represent {((data.expenses.teacherPayments / data.expenses.total) * 100).toFixed(1)}% of total expenses</li>
            <li>• General expenses account for {((data.expenses.generalExpenses / data.expenses.total) * 100).toFixed(1)}% of total expenses</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossTab;
