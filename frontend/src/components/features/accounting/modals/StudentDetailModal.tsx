import React, { useState, useEffect, useCallback } from 'react';
import { User, DollarSign, Clock, CreditCard } from 'lucide-react';
import Modal from '../../../common/Modal';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  onAddPayment?: (studentId: string) => void;
}

interface PaymentHistory {
  _id: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMethod: string;
  description?: string;
}

interface StudentDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  level: string;
  enrollmentDate: string;
  teacher: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  financials: {
    estimatedTotalFee: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    remainingBalance: number;
    paymentHistory: PaymentHistory[];
  };
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onAddPayment
}) => {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');

  const fetchStudentDetail = useCallback(async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      // This would be replaced with actual API call
      const response = await fetch(`/api/students/${studentId}/accounting`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
      }
    } catch (error) {
      console.error('Error fetching student detail:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetail();
    }
  }, [isOpen, studentId, fetchStudentDetail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details" size="xl">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Student Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                  <p className="text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Level: {student.level} | Enrolled: {formatDate(student.enrollmentDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Teacher</p>
                <p className="font-medium text-gray-900">
                  {student.teacher.profile.firstName} {student.teacher.profile.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Total Fee</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(student.financials.estimatedTotalFee)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Paid</p>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(student.financials.totalPaid)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-lg font-bold text-yellow-900">
                {formatCurrency(student.financials.totalPending)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Remaining</p>
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(student.financials.remainingBalance)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment History ({student.financials.paymentHistory.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Student Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Full Name:</span>
                        <span className="ml-2 font-medium">{student.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2">{student.phone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Level:</span>
                        <span className="ml-2">{student.level}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Enrollment Date:</span>
                        <span className="ml-2">{formatDate(student.enrollmentDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Financial Status</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          student.financials.remainingBalance === 0 
                            ? 'bg-green-100 text-green-800' 
                            : student.financials.totalOverdue > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.financials.remainingBalance === 0 
                            ? 'Fully Paid' 
                            : student.financials.totalOverdue > 0
                            ? 'Overdue'
                            : 'Partial Payment'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <div className="ml-2 mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ 
                                width: `${(student.financials.totalPaid / student.financials.estimatedTotalFee) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {((student.financials.totalPaid / student.financials.estimatedTotalFee) * 100).toFixed(1)}% paid
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onAddPayment && onAddPayment(student._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Record Payment
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                      Send Invoice
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Payment History</h4>
                  <button
                    onClick={() => onAddPayment && onAddPayment(student._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Payment
                  </button>
                </div>
                
                {student.financials.paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {student.financials.paymentHistory.map((payment) => (
                      <div key={payment._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {payment.description || 'Payment received'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Method: {payment.paymentMethod}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payment history available</p>
                    <button
                      onClick={() => onAddPayment && onAddPayment(student._id)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Record First Payment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Student not found</p>
        </div>
      )}
    </Modal>
  );
};

export default StudentDetailModal;
