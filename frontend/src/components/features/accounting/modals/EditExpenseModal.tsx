import React, { useState, useEffect } from 'react';
import { DollarSign, Building, Calendar, FileText, Upload } from 'lucide-react';
import Modal from '../../../common/Modal';
import { accountingService } from '../../../../services/accountingService';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onExpenseUpdated: () => void;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onExpenseUpdated
}) => {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    expenseDate: '',
    description: '',
    paymentMethod: 'bank_transfer',
    vendor: '',
    invoiceNumber: '',
    receiptUrl: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || '',
        amount: expense.amount?.toString() || '',
        expenseDate: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        description: expense.description || '',
        paymentMethod: 'bank_transfer',
        vendor: '',
        invoiceNumber: '',
        receiptUrl: expense.receiptUrl || '',
        status: expense.status || 'pending'
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.description || !formData.expenseDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expenseDate: formData.expenseDate,
        status: formData.status,
        vendor: formData.vendor,
        invoiceNumber: formData.invoiceNumber,
        receiptUrl: formData.receiptUrl
      };

      const response = await accountingService.updateExpense(expense._id, updateData);

      if (response.success) {
        onExpenseUpdated();
        onClose();
        alert('Expense updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = [
    { value: 'rent', label: 'Rent', icon: '🏢' },
    { value: 'utilities', label: 'Utilities', icon: '💡' },
    { value: 'supplies', label: 'Supplies', icon: '📝' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️' },
    { value: 'equipment', label: 'Equipment', icon: '💻' },
    { value: 'training', label: 'Training', icon: '📚' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const expenseStatuses = [
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  if (!expense) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expense Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4 inline mr-1" />
            Expense Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {expenseCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the expense purpose..."
            required
          />
        </div>

        {/* Vendor and Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor/Supplier
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Company or person paid"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice/Reference Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="INV-12345"
            />
          </div>
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Expense Date *
          </label>
          <input
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {expenseStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Receipt URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="h-4 w-4 inline mr-1" />
            Receipt/Invoice URL
          </label>
          <input
            type="url"
            value={formData.receiptUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/receipt.pdf"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: URL to receipt or invoice document
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditExpenseModal;
