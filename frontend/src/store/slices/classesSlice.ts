import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Class, CreateClassData, UpdateClassData } from '../../types/class';
import classService from '../../services/classService';

interface ClassesState {
  classes: Class[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ClassesState = {
  classes: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchClasses = createAsyncThunk(
  'classes/fetchClasses',
  async (teacherId?: string) => {
    return await classService.getClasses(teacherId);
  }
);

export const createClass = createAsyncThunk(
  'classes/createClass',
  async (classData: CreateClassData) => {
    return await classService.createClass(classData);
  }
);

export const updateClass = createAsyncThunk(
  'classes/updateClass',
  async ({ id, data }: { id: string; data: UpdateClassData }) => {
    return await classService.updateClass(id, data);
  }
);

export const deleteClass = createAsyncThunk(
  'classes/deleteClass',
  async (id: string) => {
    await classService.deleteClass(id);
    return id;
  }
);

const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch classes
      .addCase(fetchClasses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch classes';
      })
      
      // Create class
      .addCase(createClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes.unshift(action.payload);
      })
      .addCase(createClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create class';
      })
      
      // Update class
      .addCase(updateClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.classes.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update class';
      })
      
      // Delete class
      .addCase(deleteClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes = state.classes.filter(c => c._id !== action.payload);
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete class';
      });
  },
});

export const { clearError, setError } = classesSlice.actions;
export default classesSlice.reducer;
