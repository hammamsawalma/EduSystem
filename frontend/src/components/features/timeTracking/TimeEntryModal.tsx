import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CreateTimeEntryData, UpdateTimeEntryData, LessonType } from '../../../types/financial';
import type { Student } from '../../../types/student';

interface TimeEntryModalData {
  _id?: string;
  lessonTypeId: string;
  date: string;
  hoursWorked: number;
  description?: string;
  studentId?: string;
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTimeEntryData | UpdateTimeEntryData) => Promise<void>;
  editingEntry: TimeEntryModalData | null;
  lessonTypes: LessonType[];
  students: Student[];
}

const defaultFormData = {
  lessonTypeId: '',
  date: new Date().toISOString().split('T')[0],
  hoursWorked: 1,
  description: '',
  studentId: ''
};

const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEntry,
  lessonTypes,
  students
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        lessonTypeId: editingEntry.lessonTypeId,
        date: editingEntry.date,
        hoursWorked: editingEntry.hoursWorked,
        description: editingEntry.description || '',
        studentId: editingEntry.studentId || ''
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [editingEntry, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hoursWorked' ? parseFloat(value) || 0 : value,
    }));

    // Clear validation error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.lessonTypeId) {
      newErrors.lessonTypeId = 'Lesson type is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.hoursWorked <= 0 || formData.hoursWorked > 24) {
      newErrors.hoursWorked = 'Hours must be between 0.25 and 24';
    }

    if ((formData.hoursWorked * 4) % 1 !== 0) {
      newErrors.hoursWorked = 'Hours must be in 15-minute intervals (0.25, 0.5, 0.75, etc.)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (editingEntry) {
      await onSubmit({
        id: editingEntry._id!,
        hoursWorked: formData.hoursWorked,
        description: formData.description,
        studentId: formData.studentId || undefined
      } as UpdateTimeEntryData);
    } else {
      await onSubmit({
        lessonTypeId: formData.lessonTypeId,
        date: formData.date,
        hoursWorked: formData.hoursWorked,
        description: formData.description,
        studentId: formData.studentId || undefined
      } as CreateTimeEntryData);
    }
  };

  if (!isOpen) return null;

  const title = editingEntry ? 'Edit Time Entry' : 'Add Time Entry';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
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
          <div className="space-y-4">
            {!editingEntry && (
              <div>
                <label htmlFor="lessonTypeId" className="block text-sm font-medium text-gray-700">
                  Lesson Type
                </label>
                <select
                  id="lessonTypeId"
                  name="lessonTypeId"
                  value={formData.lessonTypeId}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                    errors.lessonTypeId ? 'border-red-300' : ''
                  }`}
                  required
                >
                  <option value="">Select a lesson type</option>
                  {lessonTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} - ${type.hourlyRate}/{type.currency}
                    </option>
                  ))}
                </select>
                {errors.lessonTypeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.lessonTypeId}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {!editingEntry && (
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                      errors.date ? 'border-red-300' : ''
                    }`}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>
              )}

              <div className={!editingEntry ? '' : 'col-span-2'}>
                <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700">
                  Hours Worked
                </label>
                <input
                  type="number"
                  id="hoursWorked"
                  name="hoursWorked"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formData.hoursWorked}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                    errors.hoursWorked ? 'border-red-300' : ''
                  }`}
                  required
                />
                {errors.hoursWorked && (
                  <p className="mt-1 text-sm text-red-600">{errors.hoursWorked}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Must be in 15-minute intervals</p>
              </div>
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student (Optional)
              </label>
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">No specific student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Add any additional notes..."
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
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEntryModal;
