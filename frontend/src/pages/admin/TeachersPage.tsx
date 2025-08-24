import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Plus, Search, Filter, Loader } from 'lucide-react';
import TeacherActionsMenu from '../../components/features/teachers/TeacherActionsMenu';
import TeacherFormModal from '../../components/features/teachers/TeacherFormModal';
import TeacherDetailsModal from '../../components/features/teachers/TeacherDetailsModal';
import ConfirmationModal from '../../components/features/teachers/ConfirmationModal';
import type { Teacher, TeacherFormData } from '../../types/teacher';
import teacherService from '../../services/teacherService';

const TeachersPage: React.FC = () => {
  // State for teachers data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states for different operations
  const [isAddingTeacher, setIsAddingTeacher] = useState<boolean>(false);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState<boolean>(false);
  const [isApprovingTeacher, setIsApprovingTeacher] = useState<boolean>(false);
  const [isBlockingTeacher, setIsBlockingTeacher] = useState<boolean>(false);
  
  // Fetch teachers from API on component mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await teacherService.getTeachers();
        setTeachers(data);
      } catch (err) {
        console.error('Failed to load teachers:', err);
        setError('Failed to load teachers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  
  // State for selected teacher
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  
  // State for search, filters, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Search and filter on the server (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchTeachers = async () => {
        try {
          setIsLoading(true);
          let data;
          
          // If there's a search query or status filter, use search endpoint
          if (searchQuery || statusFilter !== 'All') {
            data = await teacherService.searchTeachers(searchQuery, statusFilter);
          } else {
            // Otherwise, fetch all teachers
            data = await teacherService.getTeachers();
          }
          
          setTeachers(data);
        } catch (err) {
          console.error('Failed to search/fetch teachers:', err);
          // Keep the current teachers data, don't set error
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTeachers();
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);
  
  // Local filtering as fallback with null safety
  const filteredTeachers = teachers.filter(teacher => {
    // If no search query, only filter by status
    if (!searchQuery) {
      return statusFilter === 'All' || teacher.status === statusFilter;
    }
    
    // Safe search with null checks
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (teacher.profile.firstName?.toLowerCase() || '').includes(searchLower) ||
      (teacher.profile.lastName?.toLowerCase() || '').includes(searchLower) ||
      (teacher.email?.toLowerCase() || '').includes(searchLower) ||
      (teacher.profile.phone?.toLowerCase() || '').includes(searchLower) ||
      (teacher.subject?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'All' || teacher.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  
  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Handle bulk selection
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTeachers(currentTeachers.map(teacher => teacher._id));
      setShowBulkActions(true);
    } else {
      setSelectedTeachers([]);
      setShowBulkActions(false);
    }
  };
  
  const handleSelectTeacher = (e: React.ChangeEvent<HTMLInputElement>, teacherId: string) => {
    if (e.target.checked) {
      setSelectedTeachers(prev => [...prev, teacherId]);
    } else {
      setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
    }
  };
  
  useEffect(() => {
    if (selectedTeachers.length > 0) {
      setShowBulkActions(true);
    } else {
      setShowBulkActions(false);
    }
  }, [selectedTeachers]);
  
  // Bulk actions handlers
  const handleBulkApprove = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Process each selected teacher
      for (const teacherId of selectedTeachers) {
        await teacherService.updateTeacherStatus(teacherId, 'Active');
      }
      
      // Refresh the teacher list
      const updatedTeachers = await teacherService.getTeachers();
      setTeachers(updatedTeachers);
      
      // Clear selection
      setSelectedTeachers([]);
      
      // Show success message
      console.log('Teachers approved successfully!');
    } catch (err) {
      console.error('Error approving teachers:', err);
      setError('Failed to approve teachers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBulkBlock = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Process each selected teacher
      for (const teacherId of selectedTeachers) {
        await teacherService.updateTeacherStatus(teacherId, 'Blocked');
      }
      
      // Refresh the teacher list
      const updatedTeachers = await teacherService.getTeachers();
      setTeachers(updatedTeachers);
      
      // Clear selection
      setSelectedTeachers([]);
      
      // Show success message
      console.log('Teachers blocked successfully!');
    } catch (err) {
      console.error('Error blocking teachers:', err);
      setError('Failed to block teachers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBulkDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Process each selected teacher
      for (const teacherId of selectedTeachers) {
        await teacherService.deleteTeacher(teacherId);
      }
      
      // Refresh the teacher list
      const updatedTeachers = await teacherService.getTeachers();
      setTeachers(updatedTeachers);
      
      // Clear selection
      setSelectedTeachers([]);
      
      // Show success message
      console.log('Teachers deleted successfully!');
    } catch (err) {
      console.error('Error deleting teachers:', err);
      setError('Failed to delete teachers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export teachers to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Subject', 'Status', 'Join Date'];
    const csvContent = [
      headers.join(','),
      ...filteredTeachers.map(teacher => [
        teacher.profile.firstName,
        teacher.profile.lastName,
        teacher.email,
        teacher.profile.phone,
        teacher.subject,
        teacher.status,
        teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Add teacher handler
  const handleAddTeacher = async (teacher: TeacherFormData) => {
    try {
      setIsAddingTeacher(true);
      setError(null);
      
      const newTeacher = await teacherService.createTeacher(teacher);
      
      // Update the state with the new teacher
      setTeachers(prevTeachers => [...prevTeachers, newTeacher]);
      
      // Close the modal
      setIsAddModalOpen(false);
      
      // Show success message (in a real app, you would use a toast/notification)
      console.log('Teacher added successfully!');
    } catch (err) {
      console.error('Error adding teacher:', err);
      setError('Failed to add teacher. Please try again.');
    } finally {
      setIsAddingTeacher(false);
    }
  };
  
  // Edit teacher handler
  const handleEditTeacher = async (formData: TeacherFormData) => {
    if (!formData._id) return;

    try {
      setError(null);
      
      // Call API to update teacher
      const updatedTeacher = await teacherService.updateTeacher(formData._id, formData);
      
      // Update the state
      setTeachers(prevTeachers => 
        prevTeachers.map(teacher => 
          teacher._id === updatedTeacher._id ? updatedTeacher : teacher
        )
      );
      
      // Close the modal
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
      
      // Show success message
      console.log('Teacher updated successfully!');
    } catch (err) {
      console.error('Error updating teacher:', err);
      setError('Failed to update teacher. Please try again.');
    }
  };
  
  // Delete teacher handler
  const handleDeleteTeacher = async () => {
    if (selectedTeacher) {
      try {
        setIsDeletingTeacher(true);
        setError(null);
        
        // Call API to delete teacher
        await teacherService.deleteTeacher(selectedTeacher._id);
        
        // Update the state
        setTeachers(prevTeachers => 
          prevTeachers.filter(teacher => teacher._id !== selectedTeacher._id)
        );
        
        // Close the modal
        setIsDeleteModalOpen(false);
        setSelectedTeacher(null);
        
        // Show success message
        console.log('Teacher deleted successfully!');
      } catch (err) {
        console.error('Error deleting teacher:', err);
        setError('Failed to delete teacher. Please try again.');
      } finally {
        setIsDeletingTeacher(false);
      }
    }
  };
  
  // Approve teacher handler
  const handleApproveTeacher = async () => {
    if (selectedTeacher) {
      try {
        setIsApprovingTeacher(true);
        setError(null);
        
        // Call API to approve teacher
        const updatedTeacher = await teacherService.updateTeacherStatus(selectedTeacher._id, 'Active');
        
        // Update the state
        setTeachers(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        
        // Close the modal
        setIsApproveModalOpen(false);
        setSelectedTeacher(null);
        
        // Show success message
        console.log('Teacher approved successfully!');
      } catch (err) {
        console.error('Error approving teacher:', err);
        setError('Failed to approve teacher. Please try again.');
      } finally {
        setIsApprovingTeacher(false);
      }
    }
  };
  
  // Block teacher handler
  const handleBlockTeacher = async () => {
    if (selectedTeacher) {
      try {
        setIsBlockingTeacher(true);
        setError(null);
        
        // Call API to block teacher
        const updatedTeacher = await teacherService.updateTeacherStatus(selectedTeacher._id, 'Blocked');
        
        // Update the state
        setTeachers(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        
        // Close the modal
        setIsBlockModalOpen(false);
        setSelectedTeacher(null);
        
        // Show success message
        console.log('Teacher blocked successfully!');
      } catch (err) {
        console.error('Error blocking teacher:', err);
        setError('Failed to block teacher. Please try again.');
      } finally {
        setIsBlockingTeacher(false);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <div className="flex space-x-2">
          <button 
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center space-x-1"
          >
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary flex items-center space-x-1"
            disabled={isAddingTeacher}
          >
            {isAddingTeacher ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Teacher</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="sm:w-48">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <Loader className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Loading teachers...</span>
        </div>
      )}
      
      {/* No teachers message */}
      {!isLoading && teachers.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center my-8">
          <p className="text-gray-500">No teachers found. Add a new teacher to get started.</p>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {selectedTeachers.length} teachers selected
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleBulkApprove}
              className="btn btn-sm btn-success"
            >
              Approve All
            </button>
            <button 
              onClick={handleBulkBlock}
              className="btn btn-sm btn-warning"
            >
              Block All
            </button>
            <button 
              onClick={handleBulkDelete}
              className="btn btn-sm btn-danger"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Teacher table */}
      {!isLoading && teachers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedTeachers.length === currentTeachers.length && currentTeachers.length > 0}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-2 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher._id)}
                        onChange={(e) => handleSelectTeacher(e, teacher._id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.profile.firstName} {teacher.profile.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-500" />
                        {teacher.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                        {teacher.profile.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        {teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <TeacherActionsMenu
                        teacherId={teacher._id}
                        teacherStatus={teacher.status}
                        onView={() => {
                          setSelectedTeacher(teacher);
                          setIsViewModalOpen(true);
                        }}
                        onEdit={() => {
                          setSelectedTeacher(teacher);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={() => {
                          setSelectedTeacher(teacher);
                          setIsDeleteModalOpen(true);
                        }}
                        onApprove={teacher.status === 'Pending' ? () => {
                          setSelectedTeacher(teacher);
                          setIsApproveModalOpen(true);
                        } : undefined}
                        onBlock={teacher.status === 'Active' ? () => {
                          setSelectedTeacher(teacher);
                          setIsBlockModalOpen(true);
                        } : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && filteredTeachers.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredTeachers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTeachers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Previous</span>
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      number === currentPage
                        ? 'bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Next</span>
                  &gt;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Teacher Modal */}
      <TeacherFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddTeacher}
        title="Add New Teacher"
      />
      
      {/* View Teacher Details Modal */}
      <TeacherDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
      />
      
      {/* Edit Teacher Modal */}
      {selectedTeacher && (
        <TeacherFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTeacher(null);
          }}
          onSave={handleEditTeacher}
          initialData={selectedTeacher}
          title="Edit Teacher"
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${selectedTeacher?.profile.firstName} ${selectedTeacher?.profile.lastName}? This action cannot be undone.`}
        confirmText={isDeletingTeacher ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />
      
      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={handleApproveTeacher}
        title="Approve Teacher"
        message={`Are you sure you want to approve ${selectedTeacher?.profile.firstName} ${selectedTeacher?.profile.lastName}? They will have access to the system.`}
        confirmText={isApprovingTeacher ? "Approving..." : "Approve"}
        cancelText="Cancel"
        type="success"
      />
      
      {/* Block Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBlockModalOpen}
        onClose={() => {
          setIsBlockModalOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={handleBlockTeacher}
        title="Block Teacher"
        message={`Are you sure you want to block ${selectedTeacher?.profile.firstName} ${selectedTeacher?.profile.lastName}? They will lose access to the system.`}
        confirmText={isBlockingTeacher ? "Blocking..." : "Block"}
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default TeachersPage;
