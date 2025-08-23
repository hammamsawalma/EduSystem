import api from './api';
import type { AxiosRequestConfig } from 'axios';

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  grade?: string;
  subjects?: string;
  status?: string;
  balance?: number;
  joinDate?: string;
}

export interface StudentFormData {
  id?: number;
  firstName: string;
  lastName: string;
  email?: string;
  grade?: string;
  subjects?: string;
  status?: string;
  balance?: number;
}

const BASE_URL = '/students';

const studentService = {
  async getStudents(params?: Record<string, any>, config?: AxiosRequestConfig): Promise<{ data: Student[]; total?: number }> {
    try {
      // params can include page, limit, search, grade, status, teacherId, etc.
      const response = await api.get(BASE_URL, { params, ...(config || {}) });
      const data = response.data.data || [];
      const total = response.data.total ?? undefined;
      return { data, total };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  async getStudentById(id: number): Promise<Student> {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching student with ID ${id}:`, error);
      throw error;
    }
  },

  async createStudent(studentData: StudentFormData): Promise<Student> {
    try {
      const response = await api.post(BASE_URL, studentData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  async updateStudent(id: number, studentData: StudentFormData): Promise<Student> {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, studentData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating student with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteStudent(id: number): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting student with ID ${id}:`, error);
      throw error;
    }
  },

  // Bulk update for status/grade etc.
  async bulkUpdateStudents(payload: { ids: number[]; updates: Record<string, any> }): Promise<void> {
    try {
      await api.put(`${BASE_URL}/bulk-update`, payload);
    } catch (error) {
      console.error('Error bulk updating students:', error);
      throw error;
    }
  },

  // Search with optional AbortSignal support
  async searchStudents(query: string, filters?: Record<string, any>, signal?: AbortSignal): Promise<Student[]> {
    try {
      const params: Record<string, any> = { search: query, ...filters };
      const response = await api.get(BASE_URL, { params, signal });
      return response.data.data || [];
    } catch (error) {
      // If canceled, rethrow so callers can handle silently
      if ((error as any)?.code === 'ERR_CANCELED') throw error;
      console.error('Error searching students:', error);
      throw error;
    }
  }
};

export default studentService;
