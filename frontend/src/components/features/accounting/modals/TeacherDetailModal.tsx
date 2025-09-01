import React, { useState, useEffect, useCallback } from 'react';
import { User, DollarSign, Clock, CreditCard, Check, X, AlertTriangle, Briefcase } from 'lucide-react';
import Modal from '../../../common/Modal';
import { teacherService } from '../../../../services/accountingService';
import teacherServiceApi from '../../../../services/teacherService';
import type { TeacherPayment as ApiTeacherPayment } from '../../../../types/accounting';

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string | null;
  onAddPayment?: (teacherId: string) => void;
}

interface TeacherDetail {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  email: string;
  phone?: string;
  status: string;
  joinDate: string;
  totalEarnings: number;
  totalPaid: number;
  totalPending: number;
  totalRejected: number;
  unpaidAmount: number;
  pendingPayments: ApiTeacherPayment[];
  paymentHistory: ApiTeacherPayment[];
}

const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  onAddPayment
}) => {
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'pending'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeacherDetail = useCallback(async () => {
    if (!teacherId) return;
    
    try {
      setLoading(true);
      const response = await teacherService.getTeacherById(teacherId);
      
      if (response.success && response.data) {
        // Transform the API response to match our interface
        const apiData = response.data;
        const transformedData: TeacherDetail = {
          _id: apiData.teacher._id,
          profile: apiData.teacher.profile,
          email: apiData.teacher.email,
          phone: apiData.teacher.profile?.phone || '',
          status: apiData.teacher.status || 'active',
          joinDate: (apiData.teacher as any).createdAt || new Date().toISOString(),
          totalEarnings: apiData.hoursSummary?.totalEarnings || 0,
          totalPaid: apiData.paymentSummary?.toTeacher?.totalApproved || 0,
          totalPending: apiData.paymentSummary?.toTeacher?.totalPending || 0,
          totalRejected: 0, // Calculate from payment history if needed
          unpaidAmount: apiData.paymentSummary?.toTeacher?.pendingFromHours || 0,
          pendingPayments: apiData.teacherPayments?.filter(p => p.status === 'pending') || [],
          paymentHistory: apiData.teacherPayments || []
        };
        setTeacher(transformedData);
      }
    } catch (error) {
      console.error('Error fetching teacher detail:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setActionLoading(paymentId);
      const response = await teacherServiceApi.approveTeacherPayment(paymentId);
      
      if (response.success) {
        // Refresh teacher data
        await fetchTeacherDetail();
        alert('Payment approved successfully!');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(paymentId);
      const response = await teacherServiceApi.rejectTeacherPayment(paymentId, reason);
      
      if (response.success) {
        // Refresh teacher data
        await fetchTeacherDetail();
        alert('Payment rejected successfully!');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (isOpen && teacherId) {
      fetchTeacherDetail();
    }
  }, [isOpen, teacherId, fetchTeacherDetail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency = 'DZD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    <Modal isOpen={isOpen} onClose={onClose} title="Teacher Details" size="xl">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : teacher ? (
        <div className="space-y-6">
          {/* Teacher Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {teacher.profile.firstName} {teacher.profile.lastName}
                  </h3>
                  <p className="text-gray-600">{teacher.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Status: {teacher.status} | Joined: {formatDate(teacher.joinDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className={`font-medium ${teacher.unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {teacher.unpaidAmount > 0 ? `${formatCurrency(teacher.unpaidAmount)} Due` : 'Current'}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Total Earnings</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(teacher.totalEarnings)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Paid</p>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(teacher.totalPaid)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-lg font-bold text-yellow-900">
                {formatCurrency(teacher.totalPending)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <Briefcase className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Unpaid</p>
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(teacher.unpaidAmount)}
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
                Payment History ({teacher.paymentHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Payments ({teacher.pendingPayments.length})
                {teacher.pendingPayments.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Teacher Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Full Name:</span>
                        <span className="ml-2 font-medium">
                          {teacher.profile.firstName} {teacher.profile.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{teacher.email}</span>
                      </div>
                      {teacher.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2">{teacher.phone}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 capitalize">{teacher.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Join Date:</span>
                        <span className="ml-2">{formatDate(teacher.joinDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          teacher.unpaidAmount === 0 
                            ? 'bg-green-100 text-green-800' 
                            : teacher.totalPending > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {teacher.unpaidAmount === 0 
                            ? 'Current' 
                            : teacher.totalPending > 0
                            ? 'Pending Approval'
                            : 'Payment Due'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Progress:</span>
                        <div className="ml-2 mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ 
                                width: `${teacher.totalEarnings > 0 ? (teacher.totalPaid / teacher.totalEarnings) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {teacher.totalEarnings > 0 ? ((teacher.totalPaid / teacher.totalEarnings) * 100).toFixed(1) : 0}% paid
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
                      onClick={() => onAddPayment && onAddPayment(teacher._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Create Payment
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                      View Time Entries
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
                    onClick={() => onAddPayment && onAddPayment(teacher._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Payment
                  </button>
                </div>
                
                {teacher.paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {teacher.paymentHistory.map((payment) => (
                      <div key={payment._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)} {payment.currency}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {payment.description || `${payment.paymentType.replace('_', ' ')} payment`}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-2">
                              <span>Method: {payment.paymentMethod.replace('_', ' ')}</span>
                              <span>Type: {payment.paymentType.replace('_', ' ')}</span>
                              {payment.hoursWorked && (
                                <span>Hours: {payment.hoursWorked}</span>
                              )}
                              {payment.hourlyRate && (
                                <span>Rate: {formatCurrency(payment.hourlyRate)}/hr</span>
                              )}
                            </div>
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
                      onClick={() => onAddPayment && onAddPayment(teacher._id)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create First Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Pending Payments</h4>
                  <span className="text-sm text-gray-500">
                    {teacher.pendingPayments.length} payment(s) awaiting approval
                  </span>
                </div>
                
                {teacher.pendingPayments.length > 0 ? (
                  <div className="space-y-4">
                    {teacher.pendingPayments.map((payment) => (
                      <div key={payment._id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)} {payment.currency}
                              </p>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Payment Date:</span>
                                <span className="ml-2">{formatDate(payment.paymentDate)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Method:</span>
                                <span className="ml-2 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <span className="font-medium">Type:</span>
                                <span className="ml-2 capitalize">{payment.paymentType.replace('_', ' ')}</span>
                              </div>
                              {payment.hoursWorked && (
                                <div>
                                  <span className="font-medium">Hours:</span>
                                  <span className="ml-2">{payment.hoursWorked} hrs</span>
                                </div>
                              )}
                              {payment.hourlyRate && (
                                <div>
                                  <span className="font-medium">Rate:</span>
                                  <span className="ml-2">{formatCurrency(payment.hourlyRate)}/hr</span>
                                </div>
                              )}
                              {payment.reference && (
                                <div>
                                  <span className="font-medium">Reference:</span>
                                  <span className="ml-2">{payment.reference}</span>
                                </div>
                              )}
                            </div>
                            {payment.description && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-700">Description:</span>
                                <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApprovePayment(payment._id)}
                              disabled={actionLoading === payment._id}
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                              {actionLoading === payment._id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectPayment(payment._id)}
                              disabled={actionLoading === payment._id}
                              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              {actionLoading === payment._id ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending payments</p>
                    <p className="text-sm text-gray-400 mt-1">All payments have been processed</p>
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
          <p className="text-gray-500">Teacher not found</p>
        </div>
      )}
    </Modal>
  );
};

export default TeacherDetailModal;
