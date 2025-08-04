export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
  firstName: string;
  lastName: string;
  settings: {
    notifications: {
      email: boolean;
      web: boolean;
      lessonReminders: boolean;
      paymentAlerts: boolean;
    };
    theme: 'light' | 'dark';
    currency: string;
    timezone: string;
  };
  status: 'pending' | 'approved' | 'suspended';
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
