import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp,
  Users,
  Building,
  FileText
} from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import type { ProfitLossSummary } from '../../types/accounting';

// Import the actual tab components
import StudentAccountingTab from '../../components/features/accounting/StudentAccountingTab';
import TeacherAccountingTab from '../../components/features/accounting/TeacherAccountingTab';
import ExpensesTab from '../../components/features/accounting/ExpensesTab';
import ProfitLossTab from '../../components/features/accounting/ProfitLossTab';

const AccountingPage: React.FC = () => {
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  const fetchFinancialSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingService.getProfitLossSummary();
      if (response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  }, []);  
  useEffect(() => {
    fetchFinancialSummary();
  }, [fetchFinancialSummary]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const tabItems = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Building },
    { id: 'profit-loss', label: 'P&L', icon: TrendingUp }
  ];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting & Finance</h1>
          <p className="text-gray-600 mt-1">
            Manage revenues, expenses, and financial reports
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleTabChange('reports')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'students' && <StudentAccountingTab />}
          {activeTab === 'teachers' && <TeacherAccountingTab />}
          {activeTab === 'expenses' && <ExpensesTab />}
          {activeTab === 'profit-loss' && <ProfitLossTab />}
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
