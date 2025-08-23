import React from 'react';
import { X, User, Mail, Phone, Calendar, BookOpen, Shield } from 'lucide-react';
import type { Teacher } from '../../../types/teacher';

interface TeacherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

const TeacherDetailsModal: React.FC<TeacherDetailsModalProps> = ({
  isOpen,
  onClose,
  teacher,
}) => {
  if (!isOpen || !teacher) return null;

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Blocked':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Teacher Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Teacher Avatar and Basic Info */}
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <h4 className="text-xl font-semibold text-gray-900">
                  {teacher.firstName} {teacher.lastName}
                </h4>
                <div className="mt-1">
                  <span className={getStatusBadge(teacher.status)}>
                    {teacher.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="border-b border-gray-200 pb-4">
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Contact Information
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{teacher.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{teacher.phone}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border-b border-gray-200 pb-4">
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Professional Information
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{teacher.subject}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">
                      Joined: {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  System Information
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">Teacher ID: {teacher.id}</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">Account Status: {teacher.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailsModal;
