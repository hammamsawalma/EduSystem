import api from './api';
import type { Class, CreateClassData, UpdateClassData, AssignStudentsToClassData } from '../types/class';
import type { Student } from '../types/student';

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

export const classService = {
  // Get all classes
  getClasses: async (teacherId?: string): Promise<Class[]> => {
    const params = teacherId ? { teacherId } : {};
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

  // Remove student from class (admin only)
  removeStudentFromClass: async (classId: string, studentId: string): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${studentId}`);
  }
};

export default classService;
