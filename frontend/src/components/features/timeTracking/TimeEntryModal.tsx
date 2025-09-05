import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CreateTimeEntryData, UpdateTimeEntryData } from '../../../types/financial';
import type { Class } from '../../../types/class';
import type { Student } from '../../../types/student';
import AttendanceTracker from './AttendanceTracker';
import { classService } from '../../../services/classService';
import { attendanceService } from '../../../services/attendanceService';

interface TimeEntryModalData {
  _id?: string;
  date: string;
  hoursWorked: number;
  description?: string;
  classId?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTimeEntryData | UpdateTimeEntryData, attendance?: AttendanceRecord[]) => Promise<void>;
  editingEntry: TimeEntryModalData | null;
  classes: Class[];
}

const defaultFormData = {
  date: new Date().toISOString().split('T')[0],
  hoursWorked: 1,
  description: '',
  classId: ''
};

const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingEntry,
  classes
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [initialAttendance, setInitialAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date,
        hoursWorked: editingEntry.hoursWorked,
        description: editingEntry.description || '',
        classId: editingEntry.classId || ''
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
    setStudents([]);
    setAttendance([]);
    setInitialAttendance([]);
  }, [editingEntry, isOpen]);

  // Load students when class is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.classId) {
        setStudents([]);
        setInitialAttendance([]);
        return;
      }

      setLoadingStudents(true);
      try {
        // Load students for the class
        const classStudents = await classService.getClassStudents(formData.classId);
        setStudents(classStudents);

        // If editing, load existing attendance records
        if (editingEntry?._id) {
          setLoadingAttendance(true);
          try {
            const existingAttendance = await attendanceService.getAttendanceByTimeEntry(editingEntry._id);
            // Convert to the format expected by AttendanceTracker
            const attendanceRecords = existingAttendance.map(record => ({
              studentId: record.studentId,
              status: record.status === 'present' ? 'present' : 'absent' as 'present' | 'absent'
            }));
            setInitialAttendance(attendanceRecords);
          } catch (error) {
            console.error('Failed to load existing attendance:', error);
            setInitialAttendance([]);
          } finally {
            setLoadingAttendance(false);
          }
        } else {
          setInitialAttendance([]);
        }
      } catch (error) {
        console.error('Failed to load class students:', error);
        setStudents([]);
        setInitialAttendance([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [formData.classId, editingEntry?._id]);

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

    if (!formData.classId) {
      newErrors.classId = 'Class is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.classId) {
      newErrors.classId = 'Class is required';
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
      // For editing entries, include attendance if students are present
      await onSubmit({
        id: editingEntry._id!,
        hoursWorked: formData.hoursWorked,
        description: formData.description,
        classId: formData.classId || undefined,
        attendance: attendance.length > 0 ? attendance.map(record => ({
          studentId: record.studentId,
          status: record.status as 'present' | 'absent' | 'late' | 'makeup' | 'cancelled'
        })) : undefined
      } as UpdateTimeEntryData);
    } else {
      // For new entries, include attendance if students are present
      await onSubmit({
        date: formData.date,
        hoursWorked: formData.hoursWorked,
        description: formData.description,
        classId: formData.classId
      } as CreateTimeEntryData, attendance.length > 0 ? attendance : undefined);
    }
  };

  if (!isOpen) return null;

  const title = editingEntry ? 'Edit Time Entry' : 'Add Time Entry';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column - Time Entry Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Time Entry Details</h4>
                
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
                  <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
                    Class *
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((classItem) => (
                      <option key={classItem._id} value={classItem._id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                  {errors.classId && (
                    <p className="mt-1 text-sm text-red-600">{errors.classId}</p>
                  )}
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

              {/* Right column - Attendance Tracking */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Attendance Tracking</h4>
                
                <AttendanceTracker
                  classId={formData.classId}
                  students={students}
                  onAttendanceChange={setAttendance}
                  initialAttendance={initialAttendance}
                  isLoading={loadingStudents || loadingAttendance}
                />
              </div>
            </div>
          </div>
          
          <div className="border-t px-6 py-4 flex justify-end space-x-3 bg-gray-50">
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
