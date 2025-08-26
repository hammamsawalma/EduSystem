import React from 'react';
import { X, Mail, Phone, Calendar, MapPin, User, GraduationCap, CreditCard, Edit, Trash2 } from 'lucide-react';
import type { Student } from '../../../types/student';
import { formatCurrency } from '../../../utils/currency';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !student) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      check: 'Check',
      bank_transfer: 'Bank Transfer',
      online: 'Online Payment',
    };
    return labels[method] || method;
  };

  const getPaymentScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
    };
    return labels[schedule] || schedule;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-lg font-medium text-primary-600">
                {student.personalInfo.firstName.charAt(0)}{student.personalInfo.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-900">{student.fullName}</h3>
              <p className="text-sm text-gray-500">Student Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{student.fullName}</p>
                  </div>
                  
                  {student.personalInfo.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{student.personalInfo.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{student.personalInfo.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.dateOfBirth && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">{formatDate(student.personalInfo.dateOfBirth)}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.address && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">{student.personalInfo.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Information */}
              <div className="border rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Parent/Guardian Information</h4>
                <div className="space-y-3">
                  {student.parentInfo.parentName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Parent/Guardian Name</label>
                      <p className="text-gray-900">{student.parentInfo.parentName}</p>
                    </div>
                  )}
                  
                  {student.parentInfo.parentEmail && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Parent Email</label>
                        <p className="text-gray-900">{student.parentInfo.parentEmail}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.parentInfo.parentPhone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Parent Phone</label>
                        <p className="text-gray-900">{student.parentInfo.parentPhone}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.parentInfo.emergencyContact && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Emergency Contact</label>
                      <p className="text-gray-900">{student.parentInfo.emergencyContact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic & Payment Information */}
            <div className="space-y-4">
              {/* Academic Information */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <GraduationCap className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Academic Information</h4>
                </div>
                <div className="space-y-3">
                  {student.academicInfo.grade && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Grade</label>
                      <p className="text-gray-900">{student.academicInfo.grade}</p>
                    </div>
                  )}
                  
                  {student.academicInfo.subjects && student.academicInfo.subjects.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Subjects</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.academicInfo.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {student.academicInfo.learningPreferences && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Learning Preferences</label>
                      <p className="text-gray-900">{student.academicInfo.learningPreferences}</p>
                    </div>
                  )}
                  
                  {student.academicInfo.specialNeeds && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Special Needs</label>
                      <p className="text-gray-900">{student.academicInfo.specialNeeds}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Payment Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                      <p className={`text-lg font-semibold ${
                        student.paymentInfo.currentBalance > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(student.paymentInfo.currentBalance)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Paid</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(student.paymentInfo.totalPaid)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-gray-900">
                        {getPaymentMethodLabel(student.paymentInfo.paymentMethod || 'Not specified')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Schedule</label>
                      <p className="text-gray-900">
                        {getPaymentScheduleLabel(student.paymentInfo.paymentSchedule || 'Not specified')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="border rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Status & Enrollment</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status === 'active' 
                        ? 'bg-success-100 text-success-800'
                        : student.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Enrollment Date</label>
                    <p className="text-gray-900">{formatDate(student.enrollmentDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="mt-6 border rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
              <p className="text-gray-900 whitespace-pre-wrap">{student.notes}</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(student)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Student
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(student)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Student
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
