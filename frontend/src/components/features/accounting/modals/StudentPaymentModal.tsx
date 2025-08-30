import React, { useState, useEffect } from 'react';
import { DollarSign, User, Calendar, FileText } from 'lucide-react';
import Modal from '../../../common/Modal';

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
    paymentMethod: 'cash',
    description: '',
    dueDate: '',
    status: 'received'
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      student: selectedStudent
    };

    onPaymentSubmit(paymentData);
    
    // Reset form
    setFormData({
      studentId: '',
      amount: '',
      paymentMethod: 'cash',
      description: '',
      dueDate: '',
      status: 'received'
    });
    setSelectedStudent(null);
    onClose();
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online Payment' }
  ];

  const paymentStatuses = [
    { value: 'received', label: 'Received' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Student Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Payment Amount */}
        <div>
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 inline mr-1" />
            Description / Notes
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Record Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentPaymentModal;
