import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Student, CreateStudentData } from '../../../types/student';
import type { Teacher } from '../../../types/teacher';
import { teacherService } from '../../../services/teacherService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: CreateStudentData) => void;
  initialData?: Student;
  title: string;
}

const defaultStudent: CreateStudentData = {
  firstName: '',
  lastName: '',
  primaryPhone: '',
  secondaryContact: {
    name: '',
    relationship: 'parent',
    phone: '',
  },
  email: '',
  address: '',
  nationalId: '',
  level: '',
  teacherId: '',
  notes: '',
};

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
}) => {
  const [student, setStudent] = useState<CreateStudentData>(defaultStudent);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setStudent({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        primaryPhone: initialData.primaryPhone,
        secondaryContact: initialData.secondaryContact,
        email: initialData.email,
        address: initialData.address,
        nationalId: initialData.nationalId,
        level: initialData.level,
        teacherId: typeof initialData.teacherId === 'string' ? initialData.teacherId : initialData.teacherId._id,
        notes: initialData.notes || '',
      });
    } else {
      setStudent(defaultStudent);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const teachersData = await teacherService.getTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSecondaryContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      secondaryContact: {
        ...prev.secondaryContact,
        [name]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!student.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!student.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!student.primaryPhone.trim()) {
      newErrors.primaryPhone = 'Primary phone is required';
    }

    if (!student.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(student.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!student.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!student.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required';
    }

    if (!student.level.trim()) {
      newErrors.level = 'Level is required';
    }

    if (!student.teacherId) {
      newErrors.teacherId = 'Teacher assignment is required';
    }

    if (!student.secondaryContact.name.trim()) {
      newErrors.secondaryContactName = 'Secondary contact name is required';
    }

    if (!student.secondaryContact.phone.trim()) {
      newErrors.secondaryContactPhone = 'Secondary contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(student);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={student.firstName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.firstName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={student.lastName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.lastName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={student.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="primaryPhone" className="block text-sm font-medium text-gray-700">
                    Primary Phone *
                  </label>
                  <input
                    type="tel"
                    id="primaryPhone"
                    name="primaryPhone"
                    value={student.primaryPhone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.primaryPhone ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.primaryPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                    National ID *
                  </label>
                  <input
                    type="text"
                    id="nationalId"
                    name="nationalId"
                    value={student.nationalId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.nationalId ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.nationalId && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                    Level *
                  </label>
                  <input
                    type="text"
                    id="level"
                    name="level"
                    value={student.level}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.level ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.level && (
                    <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={student.address}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                    errors.address ? 'border-red-300' : ''
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h4>
              <div>
                <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">
                  Assigned Teacher *
                </label>
                <select
                  id="teacherId"
                  name="teacherId"
                  value={student.teacherId}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                    errors.teacherId ? 'border-red-300' : ''
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.profile.firstName} {teacher.profile.lastName}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherId}</p>
                )}
              </div>
            </div>

            {/* Secondary Contact Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Secondary Contact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={student.secondaryContact.name}
                    onChange={handleSecondaryContactChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.secondaryContactName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.secondaryContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.secondaryContactName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                    Relationship *
                  </label>
                  <select
                    id="relationship"
                    name="relationship"
                    value={student.secondaryContact.relationship}
                    onChange={handleSecondaryContactChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="guardian">Guardian</option>
                    <option value="relative">Relative</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={student.secondaryContact.phone}
                    onChange={handleSecondaryContactChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.secondaryContactPhone ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.secondaryContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.secondaryContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={student.notes || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Any additional notes or information about the student..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {initialData ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormModal;
