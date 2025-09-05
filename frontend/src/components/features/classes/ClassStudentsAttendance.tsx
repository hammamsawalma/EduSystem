import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import classService from '../../../services/classService';
import type { StudentWithAttendance } from '../../../services/classService';

interface ClassStudentsAttendanceProps {
  classId?: string;
}

const ClassStudentsAttendance: React.FC<ClassStudentsAttendanceProps> = ({ 
  classId: propClassId 
}) => {
  const { id: paramClassId } = useParams<{ id: string }>();
  const classId = propClassId || paramClassId;

  const [studentsWithAttendance, setStudentsWithAttendance] = useState<StudentWithAttendance[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [classStatistics, setClassStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const fetchClassAttendance = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await classService.getClassStudentsAttendance(classId);
      setStudentsWithAttendance(data.students);
      setClassInfo(data.class);
      setClassStatistics(data.classStatistics);
    } catch (err: any) {
      console.error('Failed to fetch class attendance:', err);
      setError(err.response?.data?.message || 'Failed to fetch class attendance data');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassAttendance();
  }, [fetchClassAttendance]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'makeup':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchClassAttendance}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {classInfo?.name} - Student Attendance
            </h1>
            {classInfo?.description && (
              <p className="text-gray-600 mt-1">{classInfo.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Class Statistics */}
      {classStatistics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Class Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {classStatistics.totalStudents}
              </div>
              <div className="text-sm text-blue-600">Total Students</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {classStatistics.totalSessions}
              </div>
              <div className="text-sm text-purple-600">Total Sessions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {classStatistics.averageAttendanceRate}%
              </div>
              <div className="text-sm text-green-600">Average Attendance Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Students</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {studentsWithAttendance.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              No students found for this class.
            </div>
          ) : (
            studentsWithAttendance.map((student) => (
              <div key={student._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <span className="ml-2 text-sm text-gray-500">({student.level})</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {student.email}
                    </div>
                  </div>

                  {/* Attendance Statistics */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {student.attendance.statistics.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-500">Attendance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {student.attendance.statistics.totalSessions}
                      </div>
                      <div className="text-xs text-gray-500">Total Sessions</div>
                    </div>
                    <button
                      onClick={() => setExpandedStudent(
                        expandedStudent === student._id ? null : student._id
                      )}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      {expandedStudent === student._id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStudent === student._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Attendance Breakdown */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Attendance Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div className="bg-green-50 p-2 rounded text-center">
                          <div className="font-semibold text-green-800">
                            {student.attendance.statistics.presentSessions}
                          </div>
                          <div className="text-green-600">Present</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded text-center">
                          <div className="font-semibold text-red-800">
                            {student.attendance.statistics.absentSessions}
                          </div>
                          <div className="text-red-600">Absent</div>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded text-center">
                          <div className="font-semibold text-yellow-800">
                            {student.attendance.statistics.lateSessions}
                          </div>
                          <div className="text-yellow-600">Late</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded text-center">
                          <div className="font-semibold text-blue-800">
                            {student.attendance.statistics.makeupSessions}
                          </div>
                          <div className="text-blue-600">Makeup</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <div className="font-semibold text-gray-800">
                            {student.attendance.statistics.cancelledSessions}
                          </div>
                          <div className="text-gray-600">Cancelled</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Attendance Records */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Recent Attendance Records
                      </h4>
                      {student.attendance.records.length === 0 ? (
                        <p className="text-sm text-gray-500">No attendance records found.</p>
                      ) : (
                        <div className="space-y-2">
                          {student.attendance.records.slice(0, 5).map((record) => (
                            <div key={record._id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                              <div>
                                <div className="font-medium text-sm">
                                  {formatDate((record.timeEntryId as any).date)}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}>
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                                {record.duration && (
                                  <span className="text-xs text-gray-500">
                                    {record.duration} min
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {student.attendance.records.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              ... and {student.attendance.records.length - 5} more records
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassStudentsAttendance;
