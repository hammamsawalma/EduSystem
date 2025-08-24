import React from 'react';
import { Download, type LucideIcon } from 'lucide-react';

interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  isLoading: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  iconColor,
  onExport,
  isLoading
}) => {
  const formatOptions = [
    { value: 'csv' as const, label: 'CSV' },
    { value: 'excel' as const, label: 'Excel' },
    { value: 'pdf' as const, label: 'PDF' }
  ];

  return (
    <div className={`${color} rounded-lg border p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Export Formats</h4>
        <div className="flex flex-wrap gap-2">
          {formatOptions.map((format) => (
            <button
              key={format.value}
              onClick={() => onExport(format.value)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {format.label}
              {isLoading && (
                <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
