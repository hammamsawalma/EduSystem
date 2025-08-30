import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, X, User, AlertCircle } from 'lucide-react';
import type { Student } from '../../../types/student';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

interface AttendanceTrackerProps {
  classId: string;
  students: Student[];
  onAttendanceChange: (attendance: AttendanceRecord[]) => void;
  initialAttendance?: AttendanceRecord[];
  isLoading?: boolean;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  classId,
  students,
  onAttendanceChange,
  initialAttendance = [],
  isLoading = false
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const onAttendanceChangeRef = useRef(onAttendanceChange);
  
  // Update the ref when the callback changes
  useEffect(() => {
    onAttendanceChangeRef.current = onAttendanceChange;
  }, [onAttendanceChange]);

  useEffect(() => {
    console.log('Students or initialAttendance changed:', { studentsLength: students.length, initialAttendanceLength: initialAttendance.length });
    // Initialize attendance with either initial data or default absent status
    if (initialAttendance.length > 0) {
      console.log('Setting attendance from initialAttendance');
      setAttendance(initialAttendance);
    } else if (students.length > 0) {
      // Only set attendance if we don't already have records for these students
      setAttendance(prev => {
        const existingStudentIds = new Set(prev.map(record => record.studentId));
        
        // Check if the student lists are the same
        if (prev.length === students.length && 
            students.every(student => existingStudentIds.has(student._id))) {
          console.log('Students are the same, not updating attendance');
          return prev; // No change needed
        }
        
        console.log('Creating new attendance records for students');
        // Create new attendance records
        return students.map(student => ({
          studentId: student._id,
          status: 'absent' as const
        }));
      });
    }
  }, [students, initialAttendance]);

  useEffect(() => {
    // Only call the callback if we have attendance data
    if (attendance.length > 0) {
      onAttendanceChangeRef.current(attendance);
    }
  }, [attendance]); // Use ref to avoid dependency on the callback

  const updateAttendance = (studentId: string, updates: Partial<AttendanceRecord>) => {
    console.log('Updating attendance for student:', studentId, 'with updates:', updates);
    setAttendance(prev => {
      const newAttendance = prev.map(record => 
        record.studentId === studentId 
          ? { ...record, ...updates }
          : record
      );
      console.log('New attendance state:', newAttendance);
      return newAttendance;
    });
  };

  // Memoize the attendance records map to avoid creating new objects on each render
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendance.forEach(record => {
      map.set(record.studentId, record);
    });
    return map;
  }, [attendance]);

  const getStatusCounts = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    return { present, absent };
  };

  const markAllPresent = () => {
    console.log('Mark all present clicked');
    setAttendance(prev => {
      const newAttendance = prev.map(record => ({
        ...record,
        status: 'present' as const
      }));
      console.log('Mark all present - new state:', newAttendance);
      return newAttendance;
    });
  };

  const markAllAbsent = () => {
    console.log('Mark all absent clicked');
    setAttendance(prev => {
      const newAttendance = prev.map(record => ({
        ...record,
        status: 'absent' as const
      }));
      console.log('Mark all absent - new state:', newAttendance);
      return newAttendance;
    });
  };

  if (!classId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-500">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>Select a class to track attendance</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-gray-500">
          <User className="w-4 h-4 mr-2" />
          <span>No students enrolled in this class</span>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-4">
      {/* Header with quick actions and stats */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Student Attendance ({students.length} students)
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={markAllAbsent}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
          <div className="font-semibold text-green-800">{statusCounts.present}</div>
          <div className="text-green-600">Present</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
          <div className="font-semibold text-red-800">{statusCounts.absent}</div>
          <div className="text-red-600">Absent</div>
        </div>
      </div>

      {/* Student list */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
        <div className="divide-y divide-gray-200">
          {students.map((student) => {
            const record = attendanceMap.get(student._id) || { studentId: student._id, status: 'absent' as const };
            return (
              <div key={student._id} className="p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {student.firstName} {student.lastName}
                    </div>
                    {student.primaryPhone && (
                      <div className="text-xs text-gray-500">{student.primaryPhone}</div>
                    )}
                  </div>
                  
                  {/* Status buttons */}
                  <div className="flex gap-1 ml-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Present button clicked for student:', student._id);
                        updateAttendance(student._id, { 
                          status: 'present'
                        });
                      }}
                      className={`p-1.5 rounded text-xs font-medium transition-colors ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                      }`}
                      title="Mark Present"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Absent button clicked for student:', student._id);
                        updateAttendance(student._id, { 
                          status: 'absent'
                        });
                      }}
                      className={`p-1.5 rounded text-xs font-medium transition-colors ${
                        record.status === 'absent'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                      title="Mark Absent"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
