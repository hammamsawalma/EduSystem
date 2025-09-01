import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, FileText, Building, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import Modal from '../../../common/Modal';
import { accountingService } from '../../../../services/accountingService';
import { formatCurrency } from '../../../../utils/currency';

interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string | null;
  onExpenseUpdated?: () => void;
}

interface ExpenseDetails {
  _id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
  submittedBy: {
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  approvedBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  rejectedBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseId,
  onExpenseUpdated
}) => {
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchExpenseDetails = useCallback(async () => {
    if (!expenseId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await accountingService.getExpenseById(expenseId);
      
      if (response.success) {
        setExpense(response.data.expense);
      } else {
        setError('Failed to load expense details');
      }
    } catch (error) {
      console.error('Error fetching expense details:', error);
      setError('Failed to load expense details');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseDetails();
    }
  }, [isOpen, expenseId, fetchExpenseDetails]);

  const handleApprove = async () => {
    if (!expense) return;

    try {
      setActionLoading('approve');
      const response = await accountingService.approveExpense(expense._id);
      
      if (response.success) {
        setExpense({ ...expense, status: 'approved' });
        onExpenseUpdated?.();
        alert('Expense approved successfully!');
      } else {
        alert('Failed to approve expense: ' + response.message);
      }
    } catch (error) {
      console.error('Error approving expense:', error);
      alert('Failed to approve expense');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!expense || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading('reject');
      const response = await accountingService.rejectExpense(expense._id, rejectionReason.trim());
      
      if (response.success) {
        setExpense({ 
          ...expense, 
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        });
        onExpenseUpdated?.();
        setShowRejectForm(false);
        setRejectionReason('');
        alert('Expense rejected successfully!');
      } else {
        alert('Failed to reject expense: ' + response.message);
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
      alert('Failed to reject expense');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      rent: <Building className="h-5 w-5" />,
      utilities: <Building className="h-5 w-5" />,
      supplies: <FileText className="h-5 w-5" />,
      marketing: <FileText className="h-5 w-5" />,
      maintenance: <Building className="h-5 w-5" />,
      insurance: <FileText className="h-5 w-5" />,
      default: <DollarSign className="h-5 w-5" />,
    };
    return icons[category] || icons.default;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details" size="lg">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">
          <p>{error}</p>
          <button
            onClick={fetchExpenseDetails}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : expense ? (
        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCategoryIcon(expense.category)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {expense.category}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(expense.status)}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(expense.status)}`}>
                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Expense Date
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Submitted By
                </label>
                <p className="text-sm text-gray-900">
                  {expense.submittedBy.profile.firstName} {expense.submittedBy.profile.lastName}
                </p>
                <p className="text-xs text-gray-500">{expense.submittedBy.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(expense.createdAt).toLocaleDateString()} at{' '}
                  {new Date(expense.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {expense.status === 'approved' && expense.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved By
                  </label>
                  <p className="text-sm text-gray-900">
                    {expense.approvedBy.profile.firstName} {expense.approvedBy.profile.lastName}
                  </p>
                  {expense.approvedAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(expense.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {expense.status === 'rejected' && expense.rejectedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejected By
                  </label>
                  <p className="text-sm text-gray-900">
                    {expense.rejectedBy.profile.firstName} {expense.rejectedBy.profile.lastName}
                  </p>
                  {expense.rejectedAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(expense.rejectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {expense.description}
            </p>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {expense.status === 'rejected' && expense.rejectionReason && (
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Rejection Reason
              </label>
              <p className="text-sm text-red-900 bg-red-50 p-3 rounded-md border border-red-200">
                {expense.rejectionReason}
              </p>
            </div>
          )}

          {/* Receipt URL */}
          {expense.receiptUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt/Invoice
              </label>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View Receipt/Invoice
              </a>
            </div>
          )}

          {/* Action Buttons for Pending Expenses */}
          {expense.status === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end space-x-3">
                {!showRejectForm ? (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading === 'reject'}
                      className="px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading === 'approve'}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'approve' ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading === 'reject'}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionLoading === 'reject' || !rejectionReason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'reject' ? 'Processing...' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ViewExpenseModal;
