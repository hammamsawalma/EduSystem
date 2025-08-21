import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url
      });
      
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', {
        request: error.request,
        url: error.config?.url
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Generic API request function
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: unknown,
  config?: unknown
): Promise<ApiResponse<T>> {
  try {
    const response = await api({
      method,
      url,
      // axios accepts unknown shapes; keep passing through
      data,
      ...(config as any),
    });
    return response.data;
  } catch (err: unknown) {
    // Enhanced error handling with safer typing
    const errMessage = err instanceof Error ? err.message : String(err);
    const responseData = (err as any)?.response?.data;
    console.error(`API Request Failed: ${method} ${url}`, {
      data,
      error: responseData || errMessage
    });
    
    if (responseData) {
      return responseData;
    }
    return {
      success: false,
      message: errMessage || 'An error occurred',
      error: errMessage,
    };
  }
}

// File download helper
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await api({
      method: 'GET',
      url,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
