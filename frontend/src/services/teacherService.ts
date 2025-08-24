import api from './api';
import type { Teacher, TeacherFormData } from '../types/teacher';

const BASE_URL = '/users'; // Assuming teachers are stored in the User model with role='teacher'

export const teacherService = {
  // Get all teachers
  async getTeachers(): Promise<Teacher[]> {
    try {
      const response = await api.get(`${BASE_URL}?role=teacher`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // Get a single teacher by ID
  async getTeacherById(id: number): Promise<Teacher> {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching teacher with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new teacher
  async createTeacher(teacherData: TeacherFormData): Promise<Teacher> {
    try {
      const payload = {
        ...teacherData,
        role: 'teacher',
        status: 'Pending' // New teachers are pending by default (using uppercase for consistency)
      };
      
      const response = await api.post(BASE_URL, payload);
      return response.data.data;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  // Update an existing teacher
  async updateTeacher(id: string, teacherData: TeacherFormData): Promise<Teacher> {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, teacherData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating teacher with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a teacher
  async deleteTeacher(id: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting teacher with ID ${id}:`, error);
      throw error;
    }
  },

  // Update teacher status (approve, block, etc.)
  async updateTeacherStatus(id: string, status: string): Promise<Teacher> {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating teacher status for ID ${id}:`, error);
      throw error;
    }
  },
  
  // Search and filter teachers
  async searchTeachers(query: string, statusFilter?: string): Promise<Teacher[]> {
    try {
      let url = `${BASE_URL}?role=teacher`;
      
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      
      if (statusFilter && statusFilter !== 'All') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching teachers:', error);
      throw error;
    }
  }
};

export default teacherService;
