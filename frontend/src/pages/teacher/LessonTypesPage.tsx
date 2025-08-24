import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchLessonTypes, 
  createLessonType, 
  updateLessonType, 
  deleteLessonType,
  clearError 
} from '../../store/slices/financialSlice';
import { teacherService } from '../../services/teacherService';
import type { LessonType } from '../../types/financial';
import type { Teacher } from '../../types/teacher';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  BookOpen,
  AlertCircle,
  X
} from 'lucide-react';

interface LessonTypeFormData {
  name: string;
  description: string;
  hourlyRate: number;
  currency: string;
  isActive: boolean;
  teacherId?: string;
}

const LessonTypesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { lessonTypes, isLoading, error } = useAppSelector((state) => state.financial);
  const { user } = useAppSelector((state) => state.auth);

  // Teachers state for admin
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLessonType, setSelectedLessonType] = useState<LessonType | null>(null);

  // Form state
  const [formData, setFormData] = useState<LessonTypeFormData>({
    name: '',
    description: '',
    hourlyRate: 0,
    currency: 'USD',
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
    dispatch(fetchLessonTypes());
    
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
      currency: 'USD',
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
      errors.name = 'Lesson type name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    if (formData.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    if (!['USD', 'EUR', 'GBP'].includes(formData.currency)) {
      errors.currency = 'Please select a valid currency';
    }

    if (user?.role === 'admin' && !formData.teacherId) {
      errors.teacherId = 'Please select a teacher';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateLessonType = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(createLessonType({
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
      console.error('Failed to create lesson type:', error);
    }
  };

  const handleEditLessonType = async () => {
    if (!selectedLessonType || !validateForm()) return;

    try {
      // Refresh lesson types list before updating to ensure we have the latest data
      await dispatch(fetchLessonTypes()).unwrap();
      
      await dispatch(updateLessonType({
        id: selectedLessonType._id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          hourlyRate: formData.hourlyRate,
          currency: formData.currency,
          isActive: formData.isActive
        }
      })).unwrap();

      setShowEditModal(false);
      setSelectedLessonType(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update lesson type:', error);
    }
  };

  const handleDeleteLessonType = async () => {
    if (!selectedLessonType) return;

    try {
      await dispatch(deleteLessonType(selectedLessonType._id)).unwrap();
      setShowDeleteModal(false);
      setSelectedLessonType(null);
    } catch (error) {
      console.error('Failed to delete lesson type:', error);
    }
  };

  const openEditModal = (lessonType: LessonType) => {
    setSelectedLessonType(lessonType);
    setFormData({
      name: lessonType.name,
      description: lessonType.description || '',
      hourlyRate: lessonType.hourlyRate,
      currency: lessonType.currency,
      isActive: lessonType.isActive,
      teacherId: lessonType.teacherId._id
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (lessonType: LessonType) => {
    setSelectedLessonType(lessonType);
    setShowDeleteModal(true);
  };

  const handleFormChange = (field: keyof LessonTypeFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (field !== 'isActive' && formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Filter lesson types by selected teacher (for admins)
  const filteredLessonTypes = user?.role === 'admin' && selectedTeacherFilter
    ? lessonTypes.filter(lessonType => lessonType.teacherId._id === selectedTeacherFilter)
    : lessonTypes;

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
              {user?.role === 'admin' ? 'Manage Lesson Types' : 'Lesson Types'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Manage lesson types and hourly rates for all teachers'
                : 'Manage your lesson types and hourly rates'
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
            Add Lesson Type
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

      {/* Lesson Types Content */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTeacherFilter 
                ? `Lesson Types for ${teachers.find(t => t._id === selectedTeacherFilter)?.profile.firstName} ${teachers.find(t => t._id === selectedTeacherFilter)?.profile.lastName}`
                : user?.role === 'admin' ? 'All Lesson Types' : 'Your Lesson Types'
              }
            </h2>
            <span className="text-sm text-gray-500">{filteredLessonTypes.length} total</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredLessonTypes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedTeacherFilter ? 'No lesson types found for selected teacher' : 'No lesson types yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedTeacherFilter 
                  ? 'The selected teacher has no lesson types created yet.' 
                  : 'Get started by creating your first lesson type'
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
                  Create Lesson Type
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
                  <th className="table-header-cell">Currency</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredLessonTypes.map((lessonType) => (
                  <tr key={lessonType._id} className={!lessonType.isActive ? 'opacity-60' : ''}>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{lessonType.name}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {lessonType.description || 'No description'}
                      </div>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {lessonType.teacherId.profile.firstName} {lessonType.teacherId.profile.lastName}
                          </div>
                          <div className="text-gray-500 text-xs">{lessonType.teacherId.email}</div>
                        </div>
                      </td>
                    )}
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">{lessonType.hourlyRate}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">{lessonType.currency}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lessonType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lessonType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(lessonType.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(lessonType)}
                          className="btn btn-secondary btn-sm flex items-center"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(lessonType)}
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {showCreateModal ? 'Create Lesson Type' : 'Edit Lesson Type'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedLessonType(null);
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
                  handleCreateLessonType();
                } else {
                  handleEditLessonType();
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
                      placeholder="Brief description of the lesson type..."
                    />
                    {formErrors.description && (
                      <p className="form-error">{formErrors.description}</p>
                    )}
                  </div>

                  {/* Teacher Selection (Admin only) */}
                  {user?.role === 'admin' && (
                    <div>
                      <label className="form-label">
                        Teacher *
                      </label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => handleFormChange('teacherId', e.target.value)}
                        className={`form-input ${formErrors.teacherId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        disabled={teachersLoading}
                      >
                        <option value="">Select a teacher...</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.profile.firstName} {teacher.profile.lastName} ({teacher.email})
                          </option>
                        ))}
                      </select>
                      {formErrors.teacherId && (
                        <p className="form-error">{formErrors.teacherId}</p>
                      )}
                      {teachersLoading && (
                        <p className="text-sm text-gray-500 mt-1">Loading teachers...</p>
                      )}
                    </div>
                  )}

                  {/* Hourly Rate */}
                  <div>
                    <label className="form-label">
                      Hourly Rate *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) => handleFormChange('hourlyRate', parseFloat(e.target.value) || 0)}
                        className={`form-input pr-12 ${formErrors.hourlyRate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {formErrors.hourlyRate && (
                      <p className="form-error">{formErrors.hourlyRate}</p>
                    )}
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="form-label">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleFormChange('currency', e.target.value)}
                      className={`form-input ${formErrors.currency ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                    {formErrors.currency && (
                      <p className="form-error">{formErrors.currency}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active lesson type
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedLessonType(null);
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
      {showDeleteModal && selectedLessonType && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Lesson Type
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <span className="font-medium text-gray-900">"{selectedLessonType.name}"</span>? 
                      This action cannot be undone and may affect related time entries.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteLessonType}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedLessonType(null);
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
    </div>
  );
};

export default LessonTypesPage;
