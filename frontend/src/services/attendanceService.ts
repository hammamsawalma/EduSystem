import api from './api';

export interface AttendanceRecord {
  _id?: string;
  studentId: string;
  teacherId: string;
  timeEntryId: string;
  lessonDate: string;
  lessonType: string;
  status: 'present' | 'absent' | 'late' | 'makeup' | 'cancelled';
  duration?: number;
  notes?: string;
  lateMinutes?: number;
  makeupScheduled?: string;
  makeupCompleted?: boolean;
  homework?: {
    assigned?: string;
    completed?: boolean;
    completionNotes?: string;
  };
  parentNotified?: boolean;
  parentNotifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceData {
  studentId: string;
  timeEntryId: string;
  lessonDate: string;
  lessonType: string;
  status: 'present' | 'absent' | 'late' | 'makeup' | 'cancelled';
  duration?: number;
  notes?: string;
  lateMinutes?: number;
  makeupScheduled?: string;
  homework?: {
    assigned?: string;
    completed?: boolean;
    completionNotes?: string;
  };
}

export interface UpdateAttendanceData {
  id: string;
  status?: 'present' | 'absent' | 'late' | 'makeup' | 'cancelled';
  duration?: number;
  notes?: string;
  lateMinutes?: number;
  makeupScheduled?: string;
  makeupCompleted?: boolean;
  homework?: {
    assigned?: string;
    completed?: boolean;
    completionNotes?: string;
  };
  parentNotified?: boolean;
}

export interface AttendanceStats {
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  makeupCount: number;
  cancelledCount: number;
  attendanceRate: number;
  totalDuration: number;
  avgDuration: number;
  pendingMakeups: number;
}

export interface AttendanceResponse {
  success: boolean;
  data: {
    attendance: AttendanceRecord;
  };
}

export interface AttendanceListResponse {
  success: boolean;
  data: {
    attendanceRecords: AttendanceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AttendanceStatsResponse {
  success: boolean;
  data: {
    studentId: string;
    stats: AttendanceStats;
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

export const attendanceService = {
  // Get attendance records
  getAttendanceRecords: async (params?: {
    teacherId?: string;
    studentId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AttendanceListResponse> => {
    const response = await api.get<AttendanceListResponse>('/attendance', { params });
    return response.data;
  },

  // Get single attendance record
  getAttendanceRecord: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get<AttendanceResponse>(`/attendance/${id}`);
    return response.data.data.attendance;
  },

  // Create attendance record
  createAttendanceRecord: async (data: CreateAttendanceData): Promise<AttendanceRecord> => {
    const response = await api.post<AttendanceResponse>('/attendance', data);
    return response.data.data.attendance;
  },

  // Create multiple attendance records
  createBulkAttendanceRecords: async (records: CreateAttendanceData[]): Promise<AttendanceRecord[]> => {
    const promises = records.map(record => attendanceService.createAttendanceRecord(record));
    return Promise.all(promises);
  },

  // Update attendance record
  updateAttendanceRecord: async (data: UpdateAttendanceData): Promise<AttendanceRecord> => {
    const { id, ...updateData } = data;
    const response = await api.put<AttendanceResponse>(`/attendance/${id}`, updateData);
    return response.data.data.attendance;
  },

  // Delete attendance record
  deleteAttendanceRecord: async (id: string): Promise<void> => {
    await api.delete(`/attendance/${id}`);
  },

  // Get student attendance statistics
  getStudentAttendanceStats: async (
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceStats> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get<AttendanceStatsResponse>(
      `/attendance/student/${studentId}/stats`,
      { params }
    );
    return response.data.data.stats;
  },

  // Get teacher attendance overview
  getTeacherAttendanceOverview: async (
    teacherId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> => {
    const params: any = {};
    if (teacherId) params.teacherId = teacherId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/attendance/overview', { params });
    return response.data.data.overview;
  },

  // Get attendance patterns
  getAttendancePatterns: async (
    teacherId?: string,
    period?: 'week' | 'month' | 'day'
  ): Promise<any> => {
    const params: any = {};
    if (teacherId) params.teacherId = teacherId;
    if (period) params.period = period;

    const response = await api.get('/attendance/patterns', { params });
    return response.data.data.patterns;
  },

  // Get pending makeups
  getPendingMakeups: async (teacherId?: string): Promise<AttendanceRecord[]> => {
    const params: any = {};
    if (teacherId) params.teacherId = teacherId;

    const response = await api.get('/attendance/pending-makeups', { params });
    return response.data.data.pendingMakeups;
  }
};

export default attendanceService;
