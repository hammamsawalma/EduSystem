import React, { useState, useEffect } from 'react';
import { DollarSign, User, Calendar, Clock, FileText } from 'lucide-react';
import Modal from '../../../common/Modal';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
    hourlyRate?: number;
  };
}

interface TeacherPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onPaymentSubmit: (paymentData: any) => void;
  teachers: Teacher[];
}

const TeacherPaymentModal: React.FC<TeacherPaymentModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onPaymentSubmit,
  teachers
}) => {
  const [formData, setFormData] = useState({
    teacherId: '',
    amount: '',
    hours: '',
    hourlyRate: '',
    paymentMethod: 'bank_transfer',
    description: '',
    status: 'pending',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [paymentType, setPaymentType] = useState<'manual' | 'hourly'>('manual');

  useEffect(() => {
    if (teacher) {
      setFormData(prev => ({ 
        ...prev, 
        teacherId: teacher._id,
        hourlyRate: teacher.profile?.hourlyRate?.toString() || ''
      }));
      setSelectedTeacher(teacher);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        teacherId: '',
        hourlyRate: ''
      }));
      setSelectedTeacher(null);
    }
  }, [teacher]);

  const handleTeacherSelect = (teacherId: string) => {
    const selected = teachers.find(t => t._id === teacherId);
    setSelectedTeacher(selected || null);
    setFormData(prev => ({ 
      ...prev, 
      teacherId,
      hourlyRate: selected?.profile?.hourlyRate?.toString() || ''
    }));
  };

  useEffect(() => {
    if (paymentType === 'hourly' && formData.hours && formData.hourlyRate) {
      const calculatedAmount = parseFloat(formData.hours) * parseFloat(formData.hourlyRate);
      setFormData(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
    }
  }, [formData.hours, formData.hourlyRate, paymentType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacherId || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      hours: formData.hours ? parseFloat(formData.hours) : undefined,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      teacher: selectedTeacher,
      paymentType
    };

    onPaymentSubmit(paymentData);
    
    // Reset form
    setFormData({
      teacherId: '',
      amount: '',
      hours: '',
      hourlyRate: '',
      paymentMethod: 'bank_transfer',
      description: '',
      status: 'pending',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setSelectedTeacher(null);
    setPaymentType('manual');
    onClose();
  };

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const paymentStatuses = [
    { value: 'pending', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'paid', label: 'Paid' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Teacher Payment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Teacher Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Select Teacher *
          </label>
          <select
            value={formData.teacherId}
            onChange={(e) => handleTeacherSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a teacher...</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name} - {teacher.email}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Teacher Info */}
        {selectedTeacher && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Teacher Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{selectedTeacher.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{selectedTeacher.email}</span>
              </div>
              {selectedTeacher.profile?.hourlyRate && (
                <div>
                  <span className="text-gray-500">Hourly Rate:</span>
                  <span className="ml-2">${selectedTeacher.profile.hourlyRate}/hr</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="manual"
                checked={paymentType === 'manual'}
                onChange={(e) => setPaymentType(e.target.value as 'manual' | 'hourly')}
                className="mr-2"
              />
              Manual Amount
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="hourly"
                checked={paymentType === 'hourly'}
                onChange={(e) => setPaymentType(e.target.value as 'manual' | 'hourly')}
                className="mr-2"
              />
              Calculate from Hours
            </label>
          </div>
        </div>

        {/* Hourly Calculation Fields */}
        {paymentType === 'hourly' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Hours Worked *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
                required={paymentType === 'hourly'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Hourly Rate *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required={paymentType === 'hourly'}
              />
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
            readOnly={paymentType === 'hourly'}
          />
          {paymentType === 'hourly' && (
            <p className="text-sm text-gray-500 mt-1">
              Amount is calculated automatically based on hours and rate
            </p>
          )}
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

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Payment Date
          </label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            Create Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TeacherPaymentModal;
