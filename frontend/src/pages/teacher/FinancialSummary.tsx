import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';

const FinancialSummary: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Summary</h1>
          <p className="text-gray-600">Track your earnings, expenses, and financial performance</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">$240.00</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+12.5%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">$50.00</p>
            </div>
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-error-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingDown className="w-4 h-4 text-error-600 mr-1" />
            <span className="text-sm text-error-600">+5.2%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">$190.00</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+15.8%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Worked</p>
              <p className="text-2xl font-bold text-gray-900">6.5</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
            <span className="text-sm text-success-600">+8.3%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Math Tutoring - Emma</p>
                <p className="text-xs text-gray-500">1.5 hours • $30/hour</p>
              </div>
              <span className="text-sm font-medium text-success-600">+$45.00</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Science Class - Group</p>
                <p className="text-xs text-gray-500">3.0 hours • $25/hour</p>
              </div>
              <span className="text-sm font-medium text-success-600">+$75.00</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Educational Materials</p>
                <p className="text-xs text-gray-500">Books and supplies</p>
              </div>
              <span className="text-sm font-medium text-error-600">-$50.00</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">No more expenses</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
              <span className="text-sm font-medium text-gray-500">$0.00</span>
            </div>
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
              <button className="btn btn-secondary btn-sm flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button className="btn btn-primary btn-sm flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Student Payments</h4>
            <p className="text-sm text-gray-600 mb-4">Track payments from your students</p>
            <div className="flex space-x-2">
              <button className="btn btn-secondary btn-sm flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button className="btn btn-primary btn-sm flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Tax Report</h4>
            <p className="text-sm text-gray-600 mb-4">Annual summary for tax purposes</p>
            <div className="flex space-x-2">
              <button className="btn btn-secondary btn-sm flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button className="btn btn-primary btn-sm flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
