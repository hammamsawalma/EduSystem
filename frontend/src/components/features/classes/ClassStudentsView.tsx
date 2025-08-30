import React, { useState, useEffect } from 'react';
import classService from '../../../services/classService';
import type { Student } from '../../../types/student';
import type { Class } from '../../../types/class';
import { Users, X, UserMinus, AlertCircle } from 'lucide-react';

interface ClassStudentsViewProps {
  classItem: Class;
  isOpen: boolean;
  onClose: () => void;
  onStudentRemoved?: () => void;
}

const ClassStudentsView: React.FC<ClassStudentsViewProps> = ({
  classItem,
  isOpen,
  onClose,
  onStudentRemoved
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassStudents = async () => {
      try {
        setIsLoading(true);
        const classStudents = await classService.getClassStudents(classItem._id);
        setStudents(classStudents);
      } catch (error) {
        console.error('Failed to fetch class students:', error);
        setError('Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && classItem) {
      fetchClassStudents();
    }
  }, [isOpen, classItem]);

  const handleRemoveStudent = async (studentId: string) => {
    try {
      setRemovingStudentId(studentId);
      await classService.removeStudentFromClass(classItem._id, studentId);
      
      // Update local state
      setStudents(prev => prev.filter(student => student._id !== studentId));
      
      if (onStudentRemoved) {
        onStudentRemoved();
      }
    } catch (error) {
      console.error('Failed to remove student:', error);
      setError('Failed to remove student from class');
    } finally {
      setRemovingStudentId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Students in "{classItem.name}"
              </h3>
              <p className="text-sm text-gray-500">
                Teacher: {classItem.teacherId.profile.firstName} {classItem.teacherId.profile.lastName}
              </p>
            </div>
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

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="loading-spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
            <p className="text-gray-600">
              No students have been assigned to this class yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="mb-4 text-sm text-gray-600">
              {students.length} student{students.length !== 1 ? 's' : ''} assigned to this class
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {student._id.slice(-6)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.email || 'No email'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.primaryPhone || 'No phone'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.level || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveStudent(student._id)}
                            disabled={removingStudentId === student._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Remove from class"
                          >
                            {removingStudentId === student._id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassStudentsView;
