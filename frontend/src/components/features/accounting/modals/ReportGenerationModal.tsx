import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart, TrendingUp, Building } from 'lucide-react';
import Modal from '../../../common/Modal';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerate: (reportData: any) => void;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  onReportGenerate
}) => {
  const [formData, setFormData] = useState({
    reportType: 'comprehensive',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    emailReport: false,
    emailAddress: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsGenerating(true);
    
    try {
      await onReportGenerate(formData);
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    {
      id: 'comprehensive',
      name: 'Comprehensive Financial Report',
      description: 'Complete overview of revenues, expenses, and profit/loss analysis',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'student-revenue',
      name: 'Student Revenue Report',
      description: 'Detailed breakdown of student payments and outstanding balances',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'teacher-expenses',
      name: 'Teacher Expenses Report',
      description: 'Teacher payment tracking and hourly analysis with time entries',
      icon: BarChart,
      color: 'purple'
    },
    {
      id: 'general-expenses',
      name: 'General Expenses Report',
      description: 'Operational expenses breakdown by category and period',
      icon: Building,
      color: 'orange'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Report',
      description: 'Monthly cash flow analysis with inflow and outflow tracking',
      icon: TrendingUp,
      color: 'indigo'
    }
  ];

  const reportFormats = [
    { value: 'pdf', label: 'PDF Document', icon: '📄' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: '📊' },
    { value: 'csv', label: 'CSV Data', icon: '📋' }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      green: 'border-green-200 bg-green-50 text-green-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      orange: 'border-orange-200 bg-orange-50 text-orange-700',
      indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700'
    };
    return colorMap[color as keyof typeof colorMap] || 'border-gray-200 bg-gray-50 text-gray-700';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Financial Report" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FileText className="h-4 w-4 inline mr-1" />
            Report Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((reportType) => {
              const Icon = reportType.icon;
              const isSelected = formData.reportType === reportType.id;
              return (
                <div
                  key={reportType.id}
                  onClick={() => setFormData(prev => ({ ...prev, reportType: reportType.id }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? `border-${reportType.color}-500 ${getColorClasses(reportType.color)}`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? `bg-${reportType.color}-100` : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? `text-${reportType.color}-600` : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isSelected ? `text-${reportType.color}-900` : 'text-gray-900'}`}>
                        {reportType.name}
                      </h4>
                      <p className={`text-sm mt-1 ${isSelected ? `text-${reportType.color}-700` : 'text-gray-600'}`}>
                        {reportType.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Report Period *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Report Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Download className="h-4 w-4 inline mr-1" />
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {reportFormats.map((format) => (
              <label
                key={format.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.format === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={format.value}
                  checked={formData.format === format.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                  className="sr-only"
                />
                <span className="text-lg mr-2">{format.icon}</span>
                <span className={`text-sm font-medium ${
                  formData.format === format.value ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {format.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Report Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Report Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeCharts}
                onChange={(e) => setFormData(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include charts and graphs</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.includeDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, includeDetails: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include detailed transaction data</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.emailReport}
                onChange={(e) => setFormData(prev => ({ ...prev, emailReport: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Email report when ready</span>
            </label>
          </div>
        </div>

        {/* Email Address (conditional) */}
        {formData.emailReport && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address for report delivery"
              required={formData.emailReport}
            />
          </div>
        )}

        {/* Report Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium">
                {reportTypes.find(r => r.id === formData.reportType)?.name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Format:</span>
              <span className="ml-2 font-medium">
                {reportFormats.find(f => f.value === formData.format)?.label}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Period:</span>
              <span className="ml-2">
                {formData.startDate} to {formData.endDate}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Delivery:</span>
              <span className="ml-2">
                {formData.emailReport ? 'Email + Download' : 'Download Only'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportGenerationModal;
