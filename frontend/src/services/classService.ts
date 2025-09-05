import api from './api';
import type { Class, CreateClassData, UpdateClassData, AssignStudentsToClassData } from '../types/class';
import type { Student } from '../types/student';
import type { AttendanceRecord } from './attendanceService';

export interface ClassesResponse {
  success: boolean;
  data: {
    classes: Class[];
    count: number;
  };
}

export interface ClassResponse {
  success: boolean;
  data: {
    class: Class;
  };
}

export interface ClassStudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    count: number;
  };
}

export interface StudentWithAttendance extends Student {
  attendance: {
    records: AttendanceRecord[];
    statistics: {
      totalSessions: number;
      presentSessions: number;
      absentSessions: number;
      lateSessions: number;
      makeupSessions: number;
      cancelledSessions: number;
      attendanceRate: number;
    };
  };
}

export interface ClassStudentsAttendanceResponse {
  success: boolean;
  data: {
    class: {
      _id: string;
      name: string;
      description?: string;
      teacherId: string;
    };
    students: StudentWithAttendance[];
    classStatistics: {
      totalStudents: number;
      totalSessions: number;
      averageAttendanceRate: number;
    };
    filters: {
      startDate: string | null;
      endDate: string | null;
      status: string;
    };
  };
}

export const classService = {
  // Get all classes
  getClasses: async (teacherId?: string, isActive?: boolean): Promise<Class[]> => {
    const params: any = {};
    if (teacherId) params.teacherId = teacherId;
    if (isActive !== undefined) params.isActive = isActive;
    const response = await api.get<ClassesResponse>('/classes', { params });
    return response.data.data.classes;
  },

  // Get single class
  getClass: async (id: string): Promise<Class> => {
    const response = await api.get<ClassResponse>(`/classes/${id}`);
    return response.data.data.class;
  },

  // Create class
  createClass: async (data: CreateClassData): Promise<Class> => {
    const response = await api.post<ClassResponse>('/classes', data);
    return response.data.data.class;
  },

  // Update class
  updateClass: async (id: string, data: UpdateClassData): Promise<Class> => {
    const response = await api.put<ClassResponse>(`/classes/${id}`, data);
    return response.data.data.class;
  },

  // Delete class
  deleteClass: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  // Assign students to class (admin only)
  assignStudentsToClass: async (data: AssignStudentsToClassData): Promise<void> => {
    await api.post('/classes/assign-students', data);
  },

  // Get students assigned to a class
  getClassStudents: async (classId: string): Promise<Student[]> => {
    const response = await api.get<ClassStudentsResponse>(`/classes/${classId}/students`);
    return response.data.data.students;
  },

  // Get students assigned to a class with attendance information
  getClassStudentsAttendance: async (
    classId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<ClassStudentsAttendanceResponse['data']> => {
    const params: any = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.status) params.status = filters.status;
    
    const response = await api.get<ClassStudentsAttendanceResponse>(
      `/classes/${classId}/students/attendance`,
      { params }
    );
    return response.data.data;
  },

  // Remove student from class (admin only)
  removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  }
};

export default classService;
