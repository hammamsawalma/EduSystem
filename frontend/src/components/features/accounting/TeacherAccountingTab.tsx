import React, { useState, useEffect, useCallback } from 'react';
import { User, Clock, AlertTriangle, Eye, Plus, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { accountingService } from '../../../services/accountingService';
import TeacherPaymentModal from './modals/TeacherPaymentModal';
import TeacherDetailModal from './modals/TeacherDetailModal';

interface DateRange {
  start: string;
  end: string;
}

interface Teacher {
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  hours: {
    totalHours: number;
    totalEarnings: number;
  };
  payments: {
    totalPaid: number;
    totalPending: number;
    unpaidEarnings: number;
  };
  status: {
    isPaidUp: boolean;
    deficitAmount: number;
  };
}

interface TeacherAccountingData {
  teachers: Teacher[];
  totals: {
    totalHours: number;
    totalEarnings: number;
    totalPaid: number;
    totalPending: number;
    totalUnpaid: number;
    totalDeficit: number;
  };
  teacherCount: number;
}

interface TeacherAccountingTabProps {
  dateRange: DateRange;
}

const TeacherAccountingTab: React.FC<TeacherAccountingTabProps> = ({ dateRange }) => {
  const [data, setData] = useState<TeacherAccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showTeacherDetail, setShowTeacherDetail] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const fetchTeacherAccounting = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingService.getTeacherAccounting({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching teacher accounting:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchTeacherAccounting();
  }, [fetchTeacherAccounting]);

  const getPaymentStatus = (teacher: Teacher) => {
    if (teacher.status.deficitAmount > 0) {
      return { status: 'deficit', color: 'bg-red-100 text-red-800', label: 'Payment Due' };
    }
    if (teacher.payments.totalPending > 0) {
      return { status: 'pending', color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' };
    }
    return { status: 'current', color: 'bg-green-100 text-green-800', label: 'Current' };
  };

  const handleAddPayment = (teacher?: Teacher) => {
    if (teacher) {
      setSelectedTeacher(teacher);
    }
    setShowAddPayment(true);
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      // Here you would make the API call to create teacher payment
      console.log('Creating teacher payment:', paymentData);
      
      // Refresh the data after successful payment
      await fetchTeacherAccounting();
      
      // Show success message
      alert('Teacher payment created successfully!');
    } catch (error) {
      console.error('Error creating teacher payment:', error);
      alert('Failed to create teacher payment');
    }
  };

  const handleViewTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setShowTeacherDetail(true);
  };

  const closeModals = () => {
    setShowAddPayment(false);
    setSelectedTeacher(null);
    setShowTeacherDetail(false);
    setSelectedTeacherId(null);
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Teachers</p>
              <p className="text-2xl font-bold text-blue-900">{data.teacherCount}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Hours</p>
              <p className="text-2xl font-bold text-purple-900">{data.totals.totalHours.toFixed(1)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totals.totalPaid)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(data.totals.totalPending)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Unpaid</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(data.totals.totalUnpaid)}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Teacher Payment Overview</h3>
          <button
            onClick={() => setShowAddPayment(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Process Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.teachers.map((teacherData) => {
                const status = getPaymentStatus(teacherData);
                return (
                  <tr key={teacherData.teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {teacherData.teacher.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {teacherData.teacher.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacherData.hours.totalHours.toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatCurrency(teacherData.hours.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(teacherData.payments.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {formatCurrency(teacherData.payments.totalPending)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(teacherData.payments.unpaidEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewTeacher(teacherData.teacher._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Teacher Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {teacherData.payments.unpaidEarnings > 0 && (
                        <button
                          onClick={() => handleAddPayment(teacherData)}
                          className="text-green-600 hover:text-green-900"
                          title="Create Payment"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Payment Modal */}
      <TeacherPaymentModal
        isOpen={showAddPayment}
        onClose={closeModals}
        teacher={selectedTeacher?.teacher || null}
        onPaymentSubmit={handlePaymentSubmit}
        teachers={data?.teachers.map(t => t.teacher) || []}
      />

      {/* Teacher Detail Modal */}
      <TeacherDetailModal
        isOpen={showTeacherDetail}
        onClose={closeModals}
        teacherId={selectedTeacherId}
        onAddPayment={(teacherId) => {
          const teacher = data?.teachers.find(t => t.teacher._id === teacherId);
          if (teacher) {
            handleAddPayment(teacher);
          }
        }}
      />
    </div>
  );
};

export default TeacherAccountingTab;
