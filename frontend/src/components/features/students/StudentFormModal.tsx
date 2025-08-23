import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Student, CreateStudentData } from '../../../types/student';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: CreateStudentData) => void;
  initialData?: Student;
  title: string;
}

const defaultStudent: CreateStudentData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  },
  parentInfo: {
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    emergencyContact: '',
  },
  academicInfo: {
    grade: '',
    subjects: [],
    learningPreferences: '',
    specialNeeds: '',
  },
  paymentInfo: {
    paymentMethod: 'cash',
    paymentSchedule: 'monthly',
    currentBalance: 0,
    totalPaid: 0,
  },
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subjectInput, setSubjectInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setStudent({
        personalInfo: initialData.personalInfo,
        parentInfo: initialData.parentInfo,
        academicInfo: initialData.academicInfo,
        paymentInfo: initialData.paymentInfo,
        notes: initialData.notes || '',
      });
    } else {
      setStudent(defaultStudent);
    }
    setErrors({});
    setSubjectInput('');
  }, [initialData, isOpen]);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value,
      },
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleParentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      parentInfo: {
        ...prev.parentInfo,
        [name]: value,
      },
    }));
  };

  const handleAcademicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        [name]: value,
      },
    }));
  };

  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudent((prev) => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        [name]: name === 'currentBalance' || name === 'totalPaid' ? parseFloat(value) || 0 : value,
      },
    }));
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !student.academicInfo?.subjects?.includes(subjectInput.trim())) {
      setStudent((prev) => ({
        ...prev,
        academicInfo: {
          ...prev.academicInfo,
          subjects: [...(prev.academicInfo?.subjects || []), subjectInput.trim()],
        },
      }));
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setStudent((prev) => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        subjects: prev.academicInfo?.subjects?.filter(s => s !== subject) || [],
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!student.personalInfo.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!student.personalInfo.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (student.personalInfo.email && !/\S+@\S+\.\S+/.test(student.personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (student.parentInfo?.parentEmail && !/\S+@\S+\.\S+/.test(student.parentInfo.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid parent email address';
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
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={student.personalInfo.firstName}
                    onChange={handlePersonalInfoChange}
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
                    value={student.personalInfo.lastName}
                    onChange={handlePersonalInfoChange}
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
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={student.personalInfo.email || ''}
                    onChange={handlePersonalInfoChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={student.personalInfo.phone || ''}
                    onChange={handlePersonalInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={student.personalInfo.dateOfBirth || ''}
                    onChange={handlePersonalInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={student.personalInfo.address || ''}
                    onChange={handlePersonalInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
                    Parent/Guardian Name
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={student.parentInfo?.parentName || ''}
                    onChange={handleParentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={student.parentInfo?.parentEmail || ''}
                    onChange={handleParentInfoChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.parentEmail ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.parentEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentEmail}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">
                    Parent Phone
                  </label>
                  <input
                    type="text"
                    id="parentPhone"
                    name="parentPhone"
                    value={student.parentInfo?.parentPhone || ''}
                    onChange={handleParentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={student.parentInfo?.emergencyContact || ''}
                    onChange={handleParentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                    Grade
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={student.academicInfo?.grade || ''}
                    onChange={handleAcademicInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Select Grade</option>
                    <option value="1st Grade">1st Grade</option>
                    <option value="2nd Grade">2nd Grade</option>
                    <option value="3rd Grade">3rd Grade</option>
                    <option value="4th Grade">4th Grade</option>
                    <option value="5th Grade">5th Grade</option>
                    <option value="6th Grade">6th Grade</option>
                    <option value="7th Grade">7th Grade</option>
                    <option value="8th Grade">8th Grade</option>
                    <option value="9th Grade">9th Grade</option>
                    <option value="10th Grade">10th Grade</option>
                    <option value="11th Grade">11th Grade</option>
                    <option value="12th Grade">12th Grade</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subjects
                  </label>
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                      placeholder="Add subject..."
                      className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                  {student.academicInfo?.subjects && student.academicInfo.subjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.academicInfo.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(subject)}
                            className="ml-1 text-primary-600 hover:text-primary-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="learningPreferences" className="block text-sm font-medium text-gray-700">
                    Learning Preferences
                  </label>
                  <textarea
                    id="learningPreferences"
                    name="learningPreferences"
                    rows={2}
                    value={student.academicInfo?.learningPreferences || ''}
                    onChange={handleAcademicInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700">
                    Special Needs
                  </label>
                  <textarea
                    id="specialNeeds"
                    name="specialNeeds"
                    rows={2}
                    value={student.academicInfo?.specialNeeds || ''}
                    onChange={handleAcademicInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={student.paymentInfo?.paymentMethod || 'cash'}
                    onChange={handlePaymentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="paymentSchedule" className="block text-sm font-medium text-gray-700">
                    Payment Schedule
                  </label>
                  <select
                    id="paymentSchedule"
                    name="paymentSchedule"
                    value={student.paymentInfo?.paymentSchedule || 'monthly'}
                    onChange={handlePaymentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700">
                    Current Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="currentBalance"
                    name="currentBalance"
                    value={student.paymentInfo?.currentBalance || 0}
                    onChange={handlePaymentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="totalPaid" className="block text-sm font-medium text-gray-700">
                    Total Paid ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="totalPaid"
                    name="totalPaid"
                    value={student.paymentInfo?.totalPaid || 0}
                    onChange={handlePaymentInfoChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={student.notes || ''}
                onChange={(e) => setStudent(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Additional notes about the student..."
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormModal;
