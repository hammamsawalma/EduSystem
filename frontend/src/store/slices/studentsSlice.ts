import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Student, StudentsResponse, CreateStudentData, UpdateStudentData, StudentFilters } from '../../types/student';
import { apiRequest } from '../../services/api';

interface StudentsState {
  students: Student[];
  currentStudent: Student | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: StudentFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentsState = {
  students: [],
  currentStudent: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (filters: StudentFilters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await apiRequest<StudentsResponse>(
        'GET',
        `/students?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to fetch students');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch students');
    }
  }
);

export const createStudent = createAsyncThunk(
  'students/createStudent',
  async (studentData: CreateStudentData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<Student>(
        'POST',
        '/students',
        studentData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to create student');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create student');
    }
  }
);

export const updateStudent = createAsyncThunk(
  'students/updateStudent',
  async (studentData: UpdateStudentData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<Student>(
        'PUT',
        `/students/${studentData.id}`,
        studentData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Failed to update student');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update student');
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'students/deleteStudent',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const response = await apiRequest(
        'DELETE',
        `/students/${studentId}`
      );
      
      if (response.success) {
        return studentId;
      }
      
      return rejectWithValue(response.message || 'Failed to delete student');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete student');
    }
  }
);

// Students slice
const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setCurrentStudent: (state, action) => {
      state.currentStudent = action.payload;
    },
    clearCurrentStudent: (state) => {
      state.currentStudent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch students
      .addCase(fetchStudents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = action.payload.students;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create student
      .addCase(createStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update student
      .addCase(updateStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.students.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.currentStudent?.id === action.payload.id) {
          state.currentStudent = action.payload;
        }
        state.error = null;
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete student
      .addCase(deleteStudent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = state.students.filter(s => s.id !== action.payload);
        state.pagination.total -= 1;
        if (state.currentStudent?.id === action.payload) {
          state.currentStudent = null;
        }
        state.error = null;
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, setCurrentStudent, clearCurrentStudent } = studentsSlice.actions;
export default studentsSlice.reducer;
