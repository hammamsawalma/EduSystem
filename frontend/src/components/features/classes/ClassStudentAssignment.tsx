import React, { useState, useEffect } from 'react';
// import { useAppSelector } from '../../../hooks/redux';
import classService from '../../../services/classService';
import type { Student } from '../../../types/student';
import type { Class } from '../../../types/class';
import { Users, X, Check, AlertCircle } from 'lucide-react';

interface ClassStudentAssignmentProps {
  classItem: Class;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ClassStudentAssignment: React.FC<ClassStudentAssignmentProps> = ({
  classItem,
  isOpen,
  onClose,
  onSuccess
}) => {
  // const { user } = useAppSelector((state) => state.auth);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      // We need to implement a service to get teacher's students
      // For now, this would need to be implemented in the studentService
      // const teacherStudents = await studentService.getTeacherStudents(classItem.teacherId._id);
      // setStudents(teacherStudents);
      setStudents([]); // Placeholder until we implement the service
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedStudents = async () => {
    try {
      const classStudents = await classService.getClassStudents(classItem._id);
      setAssignedStudents(classStudents);
    } catch (error) {
      console.error('Failed to fetch assigned students:', error);
    }
  };

  // Fetch students for the teacher
  useEffect(() => {
    if (isOpen && classItem) {
      fetchStudents();
      fetchAssignedStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classItem]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      setIsLoading(true);
      await classService.assignStudentsToClass({
        classId: classItem._id,
        studentIds: selectedStudentIds
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to assign students:', error);
      setError('Failed to assign students to class');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Assign Students to "{classItem.name}"
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600">
            Select students to assign to this class. Only students belonging to{' '}
            <span className="font-medium">
              {classItem.teacherId.profile.firstName} {classItem.teacherId.profile.lastName}
            </span>{' '}
            are shown.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="loading-spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              This teacher has no students available for assignment.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {students.map((student) => {
              const isSelected = selectedStudentIds.includes(student._id);
              const isAlreadyAssigned = assignedStudents.some(
                (assignedStudent) => assignedStudent._id === student._id
              );

              return (
                <div
                  key={student._id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    isAlreadyAssigned
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => !isAlreadyAssigned && handleStudentToggle(student._id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.email || 'No email'}
                      {student.level && ` • Level: ${student.level}`}
                    </div>
                    {isAlreadyAssigned && (
                      <div className="text-xs text-green-600 mt-1">
                        Already assigned to this class
                      </div>
                    )}
                  </div>
                  {!isAlreadyAssigned && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignStudents}
            disabled={isLoading || selectedStudentIds.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Assigning...' : `Assign ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassStudentAssignment;
