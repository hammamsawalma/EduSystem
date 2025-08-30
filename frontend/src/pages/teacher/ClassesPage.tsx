import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchClasses, 
  createClass, 
  updateClass, 
  deleteClass,
  clearError 
} from '../../store/slices/classesSlice';
import { teacherService } from '../../services/teacherService';
import { formatCurrency } from '../../utils/currency';
import type { Class } from '../../types/class';
import type { Teacher } from '../../types/teacher';
import ClassStudentAssignment from '../../components/features/classes/ClassStudentAssignment';
import ClassStudentsView from '../../components/features/classes/ClassStudentsView';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen,
  AlertCircle,
  X,
  Users,
  UserPlus
} from 'lucide-react';

interface ClassFormData {
  name: string;
  description: string;
  hourlyRate: number;
  currency: string;
  isActive: boolean;
  teacherId?: string;
}

const ClassesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { classes, isLoading, error } = useAppSelector((state) => state.classes);
  const { user } = useAppSelector((state) => state.auth);

  // Teachers state for admin
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Form state
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    description: '',
    hourlyRate: 0,
    currency: 'DZD',
    isActive: true,
    teacherId: user?.role === 'admin' ? '' : user?.id || ''
  });

  // Validation errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
    hourlyRate?: string;
    currency?: string;
    teacherId?: string;
  }>({});

  useEffect(() => {
    dispatch(fetchClasses());
    
    // Fetch teachers if user is admin
    if (user?.role === 'admin') {
      const fetchTeachers = async () => {
        try {
          setTeachersLoading(true);
          const teachersData = await teacherService.getTeachers();
          setTeachers(teachersData);
        } catch (error) {
          console.error('Failed to fetch teachers:', error);
        } finally {
          setTeachersLoading(false);
        }
      };
      fetchTeachers();
    }
  }, [dispatch, user?.role]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hourlyRate: 0,
      currency: 'DZD',
      isActive: true,
      teacherId: user?.role === 'admin' ? '' : user?.id || ''
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      description?: string;
      hourlyRate?: string;
      currency?: string;
      teacherId?: string;
    } = {};

    if (!formData.name.trim()) {
      errors.name = 'Class name is required';
    }

    if (formData.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    if (!formData.currency.trim()) {
      errors.currency = 'Currency is required';
    }

    if (user?.role === 'admin' && !formData.teacherId) {
      errors.teacherId = 'Please select a teacher';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClass = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(createClass({
        teacherId: formData.teacherId || user?.id || '',
        name: formData.name.trim(),
        description: formData.description.trim(),
        hourlyRate: formData.hourlyRate,
        currency: formData.currency,
        isActive: formData.isActive
      })).unwrap();

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleEditClass = async () => {
    if (!selectedClass || !validateForm()) return;

    try {
      await dispatch(updateClass({
        id: selectedClass._id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          hourlyRate: formData.hourlyRate,
          currency: formData.currency,
          isActive: formData.isActive
        }
      })).unwrap();

      setShowEditModal(false);
      setSelectedClass(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update class:', error);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      await dispatch(deleteClass(selectedClass._id)).unwrap();
      setShowDeleteModal(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const openEditModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      hourlyRate: classItem.hourlyRate,
      currency: classItem.currency,
      isActive: classItem.isActive,
      teacherId: classItem.teacherId._id
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowDeleteModal(true);
  };

  const openAssignModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowAssignModal(true);
  };

  const openStudentsModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowStudentsModal(true);
  };

  const handleFormChange = (field: keyof ClassFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (field !== 'isActive' && formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAssignmentSuccess = () => {
    // Refresh classes data
    dispatch(fetchClasses());
  };

  // Filter classes by selected teacher (for admins)
  const filteredClasses = user?.role === 'admin' && selectedTeacherFilter
    ? classes.filter(classItem => classItem.teacherId._id === selectedTeacherFilter)
    : classes;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === 'admin' ? 'Manage Classes' : 'Classes'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Manage classes and hourly rates for all teachers'
                : 'Manage your classes and hourly rates'
              }
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </button>
        </div>
      </div>

      {/* Teacher Filter (Admin only) */}
      {user?.role === 'admin' && teachers.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Teacher
          </label>
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="form-input max-w-xs"
            disabled={teachersLoading}
          >
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.profile.firstName} {teacher.profile.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => dispatch(clearError())}
              className="text-red-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Classes Content */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTeacherFilter 
                ? `Classes for ${teachers.find(t => t._id === selectedTeacherFilter)?.profile.firstName} ${teachers.find(t => t._id === selectedTeacherFilter)?.profile.lastName}`
                : user?.role === 'admin' ? 'All Classes' : 'Your Classes'
              }
            </h2>
            <span className="text-sm text-gray-500">{filteredClasses.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedTeacherFilter ? 'No classes found for selected teacher' : 'No classes yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedTeacherFilter 
                  ? 'The selected teacher has no classes created yet.' 
                  : 'Get started by creating your first class'
                }
              </p>
              {!selectedTeacherFilter && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Description</th>
                  {user?.role === 'admin' && (
                    <th className="table-header-cell">Teacher</th>
                  )}
                  <th className="table-header-cell">Hourly Rate</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem._id} className={!classItem.isActive ? 'opacity-60' : ''}>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{classItem.name}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {classItem.description || 'No description'}
                      </div>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {classItem.teacherId.profile.firstName} {classItem.teacherId.profile.lastName}
                          </div>
                          <div className="text-gray-500 text-xs">{classItem.teacherId.email}</div>
                        </div>
                      </td>
                    )}
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(classItem.hourlyRate, classItem.currency)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        classItem.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {classItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(classItem.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openStudentsModal(classItem)}
                          className="btn btn-secondary btn-sm flex items-center"
                          title="View students"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Students
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => openAssignModal(classItem)}
                            className="btn btn-primary btn-sm flex items-center"
                            title="Assign students"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(classItem)}
                          className="btn btn-secondary btn-sm flex items-center"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(classItem)}
                          className="btn btn-danger btn-sm flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="inline-block h-full w-full align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden transform transition-all">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {showCreateModal ? 'Create Class' : 'Edit Class'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedClass(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (showCreateModal) {
                  handleCreateClass();
                } else {
                  handleEditClass();
                }
              }}>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="form-label">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={`form-input ${formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., Piano Lessons, Math Tutoring"
                    />
                    {formErrors.name && (
                      <p className="form-error">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="form-label">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className={`form-input ${formErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      rows={3}
                      placeholder="Brief description of the class..."
                    />
                    {formErrors.description && (
                      <p className="form-error">{formErrors.description}</p>
                    )}
                  </div>

                  {/* Teacher (Admin only) */}
                  {user?.role === 'admin' && (
                    <div>
                      <label className="form-label">
                        Teacher *
                      </label>
                      <select
                        value={formData.teacherId || ''}
                        onChange={(e) => handleFormChange('teacherId', e.target.value)}
                        className={`form-input ${formErrors.teacherId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={teachersLoading}
                      >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.profile.firstName} {teacher.profile.lastName} ({teacher.email})
                          </option>
                        ))}
                      </select>
                      {formErrors.teacherId && (
                        <p className="form-error">{formErrors.teacherId}</p>
                      )}
                    </div>
                  )}

                  {/* Hourly Rate and Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        Hourly Rate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) => handleFormChange('hourlyRate', parseFloat(e.target.value) || 0)}
                        className={`form-input ${formErrors.hourlyRate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="0.00"
                      />
                      {formErrors.hourlyRate && (
                        <p className="form-error">{formErrors.hourlyRate}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">
                        Currency *
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleFormChange('currency', e.target.value)}
                        className={`form-input ${formErrors.currency ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      >
                        <option value="DZD">DZD (Algerian Dinar)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
                      {formErrors.currency && (
                        <p className="form-error">{formErrors.currency}</p>
                      )}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleFormChange('isActive', e.target.checked)}
                        className="form-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        Active class
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedClass(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : (showCreateModal ? 'Create' : 'Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Class</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedClass.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleDeleteClass}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedClass(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showAssignModal && selectedClass && (
        <ClassStudentAssignment
          classItem={selectedClass}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedClass(null);
          }}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Students View Modal */}
      {showStudentsModal && selectedClass && (
        <ClassStudentsView
          classItem={selectedClass}
          isOpen={showStudentsModal}
          onClose={() => {
            setShowStudentsModal(false);
            setSelectedClass(null);
          }}
          onStudentRemoved={handleAssignmentSuccess}
        />
      )}
    </div>
  );
};

export default ClassesPage;
