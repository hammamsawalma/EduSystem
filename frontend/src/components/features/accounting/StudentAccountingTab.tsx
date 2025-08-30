import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, User, Clock, AlertTriangle, Eye, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { accountingService } from '../../../services/accountingService';
import StudentPaymentModal from './modals/StudentPaymentModal';
import StudentDetailModal from './modals/StudentDetailModal';

interface DateRange {
  start: string;
  end: string;
}

interface Student {
  student: {
    _id: string;
    name: string;
    email: string;
    level: string;
    enrollmentDate: string;
    teacher: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
  financials: {
    estimatedTotalFee: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    remainingBalance: number;
    paymentHistory: number;
  };
}

interface StudentAccountingData {
  students: Student[];
  totals: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalRemaining: number;
  };
  studentCount: number;
}

interface StudentAccountingTabProps {
  dateRange: DateRange;
}

const StudentAccountingTab: React.FC<StudentAccountingTabProps> = ({ dateRange }) => {
  const [data, setData] = useState<StudentAccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudentAccounting = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingService.getStudentAccounting({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching student accounting:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchStudentAccounting();
  }, [dateRange, fetchStudentAccounting]);

  const getPaymentStatus = (student: Student) => {
    if (student.financials.totalOverdue > 0) {
      return { status: 'overdue', color: 'bg-red-100 text-red-800', label: 'Overdue' };
    }
    if (student.financials.totalPending > 0) {
      return { status: 'pending', color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
    }
    if (student.financials.remainingBalance > 0) {
      return { status: 'partial', color: 'bg-blue-100 text-blue-800', label: 'Partial' };
    }
    return { status: 'paid', color: 'bg-green-100 text-green-800', label: 'Paid Up' };
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudentId(student.student._id);
    setShowStudentDetail(true);
  };

  const handleAddPayment = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
    }
    setShowAddPayment(true);
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      // Here you would make the API call to record the payment
      console.log('Recording payment:', paymentData);
      
      // Refresh the data after successful payment
      await fetchStudentAccounting();
      
      // Show success message
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const closeModals = () => {
    setShowAddPayment(false);
    setShowStudentDetail(false);
    setSelectedStudent(null);
    setSelectedStudentId(null);
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{data.studentCount}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Collected</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totals.totalPaid)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
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
              <p className="text-sm text-red-600 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(data.totals.totalOverdue)}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Remaining</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.totals.totalRemaining)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Student Financial Overview</h3>
          <button
            onClick={() => handleAddPayment()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
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
              {data.students.map((studentData) => {
                const status = getPaymentStatus(studentData);
                return (
                  <tr key={studentData.student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {studentData.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {studentData.student.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {`${studentData.student.teacher.profile.firstName} ${studentData.student.teacher.profile.lastName}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(studentData.financials.estimatedTotalFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(studentData.financials.totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {formatCurrency(studentData.financials.totalPending)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(studentData.financials.remainingBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewStudent(studentData)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAddPayment(studentData)}
                        className="text-green-600 hover:text-green-900"
                        title="Add Payment"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentPaymentModal
        isOpen={showAddPayment}
        onClose={closeModals}
        student={selectedStudent?.student || null}
        onPaymentSubmit={handlePaymentSubmit}
        students={data?.students.map(s => s.student) || []}
      />
      
      <StudentDetailModal
        isOpen={showStudentDetail}
        onClose={closeModals}
        studentId={selectedStudentId}
        onAddPayment={(studentId) => {
          const student = data?.students.find(s => s.student._id === studentId);
          if (student) {
            setSelectedStudent(student);
            setShowStudentDetail(false);
            setShowAddPayment(true);
          }
        }}
      />
    </div>
  );
};

export default StudentAccountingTab;
