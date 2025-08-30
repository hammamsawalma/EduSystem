import React, { useState, useEffect } from 'react';
import { DollarSign, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import Modal from '../../../common/Modal';
import { studentPaymentService, paymentMethods, studentPaymentTypes } from '../../../../services/accountingService';

interface Student {
  _id: string;
  name: string;
  email: string;
  level: string;
  teacher: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

interface StudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onPaymentSubmit: (paymentData: any) => void;
  students: Student[];
}

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  onPaymentSubmit,
  students
}) => {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    currency: 'DZD',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'lesson_payment',
    reference: '',
    notes: '',
    academicPeriod: '',
    dueDate: '',
    status: 'completed'
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFormData(prev => ({ ...prev, studentId: student._id }));
      setSelectedStudent(student);
    } else {
      setFormData(prev => ({ ...prev, studentId: '' }));
      setSelectedStudent(null);
    }
  }, [student]);

  const handleStudentSelect = (studentId: string) => {
    const selected = students.find(s => s._id === studentId);
    setSelectedStudent(selected || null);
    setFormData(prev => ({ ...prev, studentId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the API to create the payment
      const paymentData = {
        studentId: formData.studentId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        paymentMethod: formData.paymentMethod as any,
        paymentDate: formData.paymentDate,
        paymentType: formData.paymentType,
        reference: formData.reference,
        notes: formData.notes,
        academicPeriod: formData.academicPeriod,
        dueDate: formData.dueDate || undefined,
        status: formData.status
      };

      await studentPaymentService.createStudentPayment(paymentData);
      
      // Call the parent callback
      onPaymentSubmit({
        ...paymentData,
        student: selectedStudent
      });

      // Reset form
      setFormData({
        studentId: '',
        amount: '',
        currency: 'DZD',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentType: 'lesson_payment',
        reference: '',
        notes: '',
        academicPeriod: '',
        dueDate: '',
        status: 'completed'
      });
      setSelectedStudent(null);
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Failed to create payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentStatuses = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  const currencies = [
    { value: 'DZD', label: 'DZD (Algerian Dinar)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'EUR', label: 'EUR (Euro)' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Student Payment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Select Student *
          </label>
          <select
            value={formData.studentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} - {student.email}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Student Info */}
        {selectedStudent && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{selectedStudent.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{selectedStudent.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Level:</span>
                <span className="ml-2">{selectedStudent.level}</span>
              </div>
              <div>
                <span className="text-gray-500">Teacher:</span>
                <span className="ml-2">
                  {selectedStudent.teacher.profile.firstName} {selectedStudent.teacher.profile.lastName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Amount and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Payment Amount *
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Payment Date *
          </label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type
          </label>
          <select
            value={formData.paymentType}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {studentPaymentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
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

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {paymentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reference Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Number
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional reference number"
          />
        </div>

        {/* Academic Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Period
          </label>
          <input
            type="text"
            value={formData.academicPeriod}
            onChange={(e) => setFormData(prev => ({ ...prev, academicPeriod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-2025 Term 1"
          />
        </div>

        {/* Due Date (for pending payments) */}
        {formData.status === 'pending' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes about this payment..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentPaymentModal;
