import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { useToast } from '../../components/ui/ToastContext';
import studentService from '../../services/studentService';
import type { Student } from '../../services/studentService';
import StudentFormModal from '../../components/features/students/StudentFormModal';
import ConfirmationModal from '../../components/features/teachers/ConfirmationModal';

const StudentList: React.FC = () => {
  const toast = useToast();

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search / filter / pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<string | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);

  // Modal state placeholders (implementation planned in Phase A)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students with debounce and cancellation
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const fetchStudents = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const params: Record<string, any> = {
            page: currentPage,
            limit: itemsPerPage
          };

          if (searchQuery) params.search = searchQuery;
          if (gradeFilter && gradeFilter !== 'All') params.grade = gradeFilter;
          if (statusFilter && statusFilter !== 'All') params.status = statusFilter;

          const { data, total } = await studentService.getStudents(params, { signal: controller.signal } as any);
          setStudents(data);
          if (typeof total === 'number') setTotalItems(total);
        } catch (err: any) {
          if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
            return;
          }
          console.error('Failed to load students:', err);
          setError('Failed to load students. Please try again.');
          toast.error('Failed to load students. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchStudents();
    }, 400); // debounce

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, gradeFilter, statusFilter, currentPage, itemsPerPage, toast]);

  // Export current filtered students to CSV
  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Grade', 'Subjects', 'Status', 'Balance'];
    const rows = students.map(s => [
      s.firstName,
      s.lastName,
      s.email || '',
      s.grade || '',
      s.subjects || '',
      s.status || '',
      typeof s.balance === 'number' ? s.balance.toFixed(2) : ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export started');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage your student information and progress</p>
        </div>
        <button
          className="btn btn-primary flex items-center"
          onClick={() => {
            // Add modal implementation planned in Phase A
            setIsAddModalOpen(true);
            toast.info('Open Add Student modal (not implemented yet)');
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </button>
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
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input pl-10"
              />
            </div>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="form-select"
          >
            <option value="All">All Grades</option>
            <option value="9th Grade">9th Grade</option>
            <option value="10th Grade">10th Grade</option>
            <option value="11th Grade">11th Grade</option>
            <option value="12th Grade">12th Grade</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-select"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Alumni">Alumni</option>
          </select>
          <button
            className="btn btn-secondary flex items-center"
            onClick={() => {
              // Advanced filter panel planned
              toast.info('Open filter panel (not implemented yet)');
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button
            className="btn btn-secondary flex items-center"
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Students Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Grade</th>
                <th className="table-header-cell">Subject</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Balance</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    <div className="animate-pulse text-gray-500">Loading students...</div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">No students found</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {((s.firstName?.[0] || '') + (s.lastName?.[0] || '')).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{s.grade || 'N/A'}</td>
                    <td className="table-cell">{s.subjects || 'N/A'}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        {s.status || 'Active'}
                      </span>
                    </td>
                    <td className="table-cell">{typeof s.balance === 'number' ? `$${s.balance.toFixed(2)}` : '$0.00'}</td>
                    <td className="table-cell">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsEditModalOpen(true);
                          toast.info('Open View/Edit modal (not implemented yet)');
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
          <div className="text-sm text-gray-700">
            Showing {students.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems ?? (currentPage * itemsPerPage))} of {totalItems ?? 'unknown'} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <StudentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (formData) => {
          try {
            // If id exists, update; otherwise create
            if ((formData as any).id) {
              await studentService.updateStudent((formData as any).id, formData);
              toast.success('Student updated successfully');
            } else {
              await studentService.createStudent(formData);
              toast.success('Student added successfully');
            }
            // Refresh list
            setCurrentPage(1);
            setSearchQuery('');
            // Clear selection and close modal handled by StudentFormModal via onClose
            setSelectedStudent(null);
            // Simple refresh: refetch by toggling currentPage to trigger effect
            setCurrentPage(prev => prev);
          } catch (err) {
            console.error('Error saving student:', err);
            toast.error('Failed to save student');
            throw err;
          }
        }}
        initialData={selectedStudent ?? undefined}
        title={selectedStudent ? 'Edit Student' : 'Add Student'}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={async () => {
          if (!selectedStudent) return;
          try {
            setIsLoading(true);
            await studentService.deleteStudent(selectedStudent.id);
            toast.success('Student deleted successfully');
            // refresh list
            setCurrentPage(1);
            setSearchQuery('');
            setSelectedStudent(null);
          } catch (err) {
            console.error('Error deleting student:', err);
            toast.error('Failed to delete student');
          } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
          }
        }}
        title="Delete Student"
        message={`Are you sure you want to delete ${selectedStudent?.firstName} ${selectedStudent?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default StudentList;
