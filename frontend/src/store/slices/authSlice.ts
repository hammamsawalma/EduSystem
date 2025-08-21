import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials, RegisterData, User } from '../../types/auth';
import { apiRequest } from '../../services/api';

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ token: string; user: User }>(
        'POST',
        '/auth/login',
        credentials
      );
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Login failed');
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return rejectWithValue(errMessage || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ user: User }>(
        'POST',
        '/auth/register',
        userData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.message || 'Registration failed');
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return rejectWithValue(errMessage || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest('POST', '/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    } catch (err: unknown) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const errMessage = err instanceof Error ? err.message : String(err);
      return rejectWithValue(errMessage || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ user: User }>(
        'GET',
        '/users/profile'
      );
      
      if (response.success && response.data) {
        return response.data.user;
      }
      
      return rejectWithValue(response.message || 'Failed to get user');
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      return rejectWithValue(errMessage || 'Failed to get user');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      
      if (token && userString) {
        try {
          const user = JSON.parse(userString);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // User needs admin approval, so don't set as authenticated
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  },
});

export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
