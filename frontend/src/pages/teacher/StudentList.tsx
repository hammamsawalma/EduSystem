import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { createStudent, fetchStudents, deleteStudent, updateStudent } from '../../store/slices/studentsSlice';
import { useAppSelector } from '../../hooks/redux';
import StudentFormModal from '../../components/features/students/StudentFormModal';
import StudentDetailsModal from '../../components/features/students/StudentDetailsModal';
import StudentActionsMenu from '../../components/features/students/StudentActionsMenu';
import type { CreateStudentData, Student } from '../../types/student';
import type { AppDispatch } from '../../store';

const StudentList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get students data from Redux store
  const { students, isLoading, error } = useAppSelector(state => state.students);
  const { user } = useAppSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';

  // Fetch students on component mount
  useEffect(() => {
    dispatch(fetchStudents({}));
  }, [dispatch]);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.nationalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student?.secondaryContact?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async (studentData: CreateStudentData) => {
    try {
      if (selectedStudent) {
        // Update existing student
        await dispatch(updateStudent({ 
          id: selectedStudent.id, 
          ...studentData 
        })).unwrap();
      } else {
        // Create new student
        await dispatch(createStudent(studentData)).unwrap();
      }
      setIsModalOpen(false);
      setSelectedStudent(null);
      // Refresh the student list
      dispatch(fetchStudents({}));
      // You might want to show a success message here
    } catch (error) {
      // Handle error - you might want to show an error message
      console.error('Failed to save student:', error);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleEditStudent = (student: Student) => {
    // Close details modal first
    setIsDetailsModalOpen(false);
    // Set the student for editing and open the form modal
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`)) {
      try {
        await dispatch(deleteStudent(student.id)).unwrap();
        setIsDetailsModalOpen(false);
        setSelectedStudent(null);
        // Refresh the student list
        dispatch(fetchStudents({}));
        // You might want to show a success message here
      } catch (error) {
        // Handle error - you might want to show an error message
        console.error('Failed to delete student:', error);
      }
    }
  };

  const handleActivateStudent = async (student: Student) => {
    try {
      await dispatch(updateStudent({
        id: student.id,
        status: 'active'
      })).unwrap();
      // Refresh the student list
      dispatch(fetchStudents({}));
    } catch (error) {
      console.error('Failed to activate student:', error);
    }
  };

  const handleSuspendStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to suspend ${student.fullName}?`)) {
      try {
        await dispatch(updateStudent({
          id: student.id,
          status: 'suspended'
        })).unwrap();
        // Refresh the student list
        dispatch(fetchStudents({}));
      } catch (error) {
        console.error('Failed to suspend student:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">
            Manage your student information and progress
            {students.length > 0 && ` • ${students.length} student${students.length === 1 ? '' : 's'} total`}
          </p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-secondary flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="btn btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Level</th>
                <th className="table-header-cell">National ID</th>
                <th className="table-header-cell">Secondary Contact</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-red-600">
                    Error loading students: {error}
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-gray-500">
                    {searchTerm ? 'No students found matching your search.' : 'No students found. Add your first student!'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                          <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{student.level || 'Not specified'}</td>
                    <td className="table-cell">{student.nationalId}</td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p className="font-medium">{student.secondaryContact.name}</p>
                        <p className="text-gray-500 text-xs">{student.secondaryContact.relationship} - {student.secondaryContact.phone}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-success-100 text-success-800'
                          : student.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <StudentActionsMenu
                        studentId={student.id}
                        studentStatus={student.status}
                        onView={() => handleViewStudent(student)}
                        onEdit={isAdmin ? () => handleEditStudent(student) : undefined}
                        onDelete={isAdmin ? () => handleDeleteStudent(student) : undefined}
                        onActivate={isAdmin ? () => handleActivateStudent(student) : undefined}
                        onSuspend={isAdmin ? () => handleSuspendStudent(student) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        onSave={handleAddStudent}
        initialData={selectedStudent || undefined}
        title={selectedStudent ? "Edit Student" : "Add New Student"}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        student={selectedStudent}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />
    </div>
  );
};

export default StudentList;
