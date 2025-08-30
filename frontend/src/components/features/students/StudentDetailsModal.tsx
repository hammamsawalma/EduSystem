import React from 'react';
import { X, Mail, Phone, User, GraduationCap, Edit, Trash2, IdCard, MapPin, Users } from 'lucide-react';
import type { Student } from '../../../types/student';

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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-lg font-medium text-primary-600">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                {student.firstName} {student.lastName}
              </h3>
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
                    <p className="text-gray-900">{student.firstName} {student.lastName}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{student.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Primary Phone</label>
                      <p className="text-gray-900">{student.primaryPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">National ID</label>
                      <p className="text-gray-900">{student.nationalId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{student.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Contact Information */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Secondary Contact</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Contact Name</label>
                    <p className="text-gray-900">{student.secondaryContact.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Relationship</label>
                    <p className="text-gray-900 capitalize">{student.secondaryContact.relationship}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Contact Phone</label>
                      <p className="text-gray-900">{student.secondaryContact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <GraduationCap className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Academic Information</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Level</label>
                    <p className="text-gray-900">{student.level}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Assigned Teacher</label>
                    <p className="text-gray-900">
                      {typeof student.teacherId === 'string' 
                        ? student.teacherId 
                        : `${student.teacherId.profile.firstName} ${student.teacherId.profile.lastName}`}
                    </p>
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
                        ? 'bg-green-100 text-green-800'
                        : student.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-gray-900">{formatDate(student.createdAt)}</p>
                  </div>
                  
                  {student.updatedAt !== student.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900">{formatDate(student.updatedAt)}</p>
                    </div>
                  )}
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
