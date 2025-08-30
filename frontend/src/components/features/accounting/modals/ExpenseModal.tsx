import React, { useState } from 'react';
import { DollarSign, Building, Calendar, FileText, Upload } from 'lucide-react';
import Modal from '../../../common/Modal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseSubmit: (expenseData: any) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseSubmit
}) => {
  const [formData, setFormData] = useState({
    category: 'supplies',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    paymentMethod: 'bank_transfer',
    vendor: '',
    invoiceNumber: '',
    receiptUrl: '',
    status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.description || !formData.expenseDate) {
      alert('Please fill in all required fields');
      return;
    }

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onExpenseSubmit(expenseData);
    
    // Reset form
    setFormData({
      category: 'supplies',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: 'bank_transfer',
      vendor: '',
      invoiceNumber: '',
      receiptUrl: '',
      status: 'pending'
    });
    onClose();
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

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const expenseStatuses = [
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'paid', label: 'Paid' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Expense" size="lg">
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

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
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

        {/* Summary Box */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Expense Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium">
                {expenseCategories.find(c => c.value === formData.category)?.label}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 font-medium">
                ${formData.amount || '0.00'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2">{formData.expenseDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2">
                {expenseStatuses.find(s => s.value === formData.status)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseModal;
