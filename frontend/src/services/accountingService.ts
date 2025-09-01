import api from './api';
import type {
  TeacherPayment,
  CreateTeacherPaymentRequest,
  FinancialReport,
  GenerateReportRequest,
  StudentAccountingResponse,
  TeacherAccountingResponse,
  ProfitLossSummary,
  CashFlowResponse,
  GeneralExpensesResponse,
  TeacherWithPaymentSummary,
  TeacherDetailsResponse,
  HoursAnalysis,
  ApiResponse
} from '../types/accounting';

// Teacher Management Services
export const teacherService = {
  // Get all teachers with payment summaries
  getAllTeachers: async (params?: {
    search?: string;
    status?: string;
  }): Promise<ApiResponse<TeacherWithPaymentSummary[]>> => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  // Get teacher details with comprehensive data
  getTeacherById: async (
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<TeacherDetailsResponse>> => {
    const response = await api.get(`/teachers/${id}`, { params });
    return response.data;
  },

  // Get teacher payment history
  getTeacherPayments: async (
    teacherId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<TeacherPayment[]>> => {
    const response = await api.get(`/teachers/${teacherId}/payments`, { params });
    return response.data;
  },

  // Create teacher payment
  createTeacherPayment: async (
    teacherId: string,
    data: CreateTeacherPaymentRequest
  ): Promise<ApiResponse<TeacherPayment>> => {
    const response = await api.post(`/teachers/${teacherId}/payments`, data);
    return response.data;
  },

  // Approve teacher payment
  approveTeacherPayment: async (paymentId: string): Promise<ApiResponse<TeacherPayment>> => {
    const response = await api.put(`/teachers/payments/${paymentId}/approve`);
    return response.data;
  },

  // Mark teacher payment as paid
  markTeacherPaymentPaid: async (
    paymentId: string,
    data?: { paidAt?: string }
  ): Promise<ApiResponse<TeacherPayment>> => {
    const response = await api.put(`/teachers/payments/${paymentId}/pay`, data);
    return response.data;
  },

  // Get overdue teacher payments
  getOverdueTeacherPayments: async (): Promise<ApiResponse<TeacherPayment[]>> => {
    const response = await api.get('/teachers/payments/overdue');
    return response.data;
  },

  // Get teacher hours analysis
  getTeacherHoursAnalysis: async (
    teacherId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<HoursAnalysis>> => {
    const response = await api.get(`/teachers/${teacherId}/hours-analysis`, { params });
    return response.data;
  }
};

// Accounting Services
export const accountingService = {
  // Get student accounting (revenues)
  getStudentAccounting: async (params?: {
    startDate?: string;
    endDate?: string;
    teacherId?: string;
  }): Promise<ApiResponse<StudentAccountingResponse>> => {
    const response = await api.get('/accounting/students', { params });
    return response.data;
  },

  // Get teacher accounting (expenses)
  getTeacherAccounting: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<TeacherAccountingResponse>> => {
    const response = await api.get('/accounting/teachers', { params });
    return response.data;
  },

  // Get general expenses
  getGeneralExpenses: async (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<GeneralExpensesResponse>> => {
    const response = await api.get('/accounting/expenses', { params });
    return response.data;
  },

  // Generate financial report
  generateFinancialReport: async (
    data: GenerateReportRequest
  ): Promise<ApiResponse<FinancialReport>> => {
    const response = await api.post('/accounting/reports', data);
    return response.data;
  },

  // Get saved financial reports
  getFinancialReports: async (params?: {
    page?: number;
    limit?: number;
    reportType?: string;
  }): Promise<ApiResponse<FinancialReport[]>> => {
    const response = await api.get('/accounting/reports', { params });
    return response.data;
  },

  // Get profit/loss summary
  getProfitLossSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ProfitLossSummary>> => {
    const response = await api.get('/accounting/profit-loss', { params });
    return response.data;
  },

  // Get financial comparison
  getFinancialComparison: async (params: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/accounting/comparison', { params });
    return response.data;
  },

  // Get cash flow
  getCashFlow: async (params?: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }): Promise<ApiResponse<CashFlowResponse>> => {
    const response = await api.get('/accounting/cashflow', { params });
    return response.data;
  },

  // Create expense
  createExpense: async (data: {
    category: string;
    amount: number;
    description: string;
    expenseDate: string;
    paymentMethod?: string;
    status?: string;
    vendor?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/accounting/expenses', {
      category: data.category,
      amount: data.amount,
      description: data.description,
      expenseDate: data.expenseDate,
      paymentMethod: data.paymentMethod || 'bank_transfer',
      status: data.status || 'pending',
      vendor: data.vendor || '',
      invoiceNumber: data.invoiceNumber || '',
      receiptUrl: data.receiptUrl || ''
    });
    return response.data;
  },

  // Get single expense
  getExpenseById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/accounting/expenses/${id}`);
    return response.data;
  },

  // Update expense
  updateExpense: async (
    id: string,
    data: {
      category?: string;
      amount?: number;
      description?: string;
      expenseDate?: string;
      status?: string;
      vendor?: string;
      invoiceNumber?: string;
      receiptUrl?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/accounting/expenses/${id}`, data);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/accounting/expenses/${id}`);
    return response.data;
  },

  // Approve expense
  approveExpense: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/accounting/expenses/${id}/approve`);
    return response.data;
  },

  // Reject expense
  rejectExpense: async (id: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/accounting/expenses/${id}/reject`, { reason });
    return response.data;
  }
};

// Student Payment Services
export const studentPaymentService = {
  // Create student payment
  createStudentPayment: async (data: {
    studentId: string;
    amount: number;
    currency?: string;
    paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'online' | 'card' | 'mobile_payment';
    paymentDate: string;
    paymentType?: string;
    reference?: string;
    notes?: string;
    academicPeriod?: string;
    dueDate?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/payments', {
      studentId: data.studentId,
      amount: data.amount,
      currency: data.currency || 'DZD',
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      paymentType: data.paymentType || 'lesson_payment',
      reference: data.reference || '',
      notes: data.notes || '',
      academicPeriod: data.academicPeriod || '',
      dueDate: data.dueDate,
      status: data.status || 'completed'
    });
    return response.data;
  },

  // Get student payments
  getStudentPayments: async (
    studentId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/payments/student/${studentId}`, { params });
    return response.data;
  },

  // Get all payments
  getAllPayments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
    paymentMethod?: string;
    paymentType?: string;
  }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  // Approve payment
  approvePayment: async (paymentId: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/payments/${paymentId}/approve`);
    return response.data;
  },

  // Reject payment
  rejectPayment: async (paymentId: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/payments/${paymentId}/reject`, { reason });
    return response.data;
  },

  // Get pending payments
  getPendingPayments: async (params?: {
    teacherId?: string;
    studentId?: string;
  }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/payments/pending/all', { params });
    return response.data;
  },

  // Get student accounting details
  getStudentAccountingDetails: async (studentId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/students/${studentId}/accounting`);
    return response.data;
  },

  // Approve teacher payment
  approveTeacherPayment: async (paymentId: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/teachers/payments/${paymentId}/approve`);
    return response.data;
  },

  // Reject teacher payment
  rejectTeacherPayment: async (paymentId: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await api.put(`/teachers/payments/${paymentId}/reject`, { reason });
    return response.data;
  }
};

// Enhanced expense categories
export const expenseCategories = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'communication', label: 'Communication' },
  { value: 'software', label: 'Software' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'training', label: 'Training' },
  { value: 'legal', label: 'Legal' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'other', label: 'Other' }
];

// Payment methods
export const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online Payment' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'mobile_payment', label: 'Mobile Payment' }
];

// Teacher payment types
export const teacherPaymentTypes = [
  { value: 'salary', label: 'Salary' },
  { value: 'hourly_payment', label: 'Hourly Payment' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'commission', label: 'Commission' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'advance', label: 'Advance Payment' },
  { value: 'other', label: 'Other' }
];

// Student payment types
export const studentPaymentTypes = [
  { value: 'lesson_payment', label: 'Lesson Payment' },
  { value: 'registration_fee', label: 'Registration Fee' },
  { value: 'material_fee', label: 'Material Fee' },
  { value: 'makeup_fee', label: 'Makeup Fee' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'other', label: 'Other' }
];

// Report types
export const reportTypes = [
  { value: 'daily', label: 'Daily Report' },
  { value: 'weekly', label: 'Weekly Report' },
  { value: 'monthly', label: 'Monthly Report' },
  { value: 'quarterly', label: 'Quarterly Report' },
  { value: 'yearly', label: 'Yearly Report' },
  { value: 'custom', label: 'Custom Period' }
];

// Utility functions
export const formatCurrency = (amount: number, currency = 'DZD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'approved':
      return 'green';
    case 'pending':
      return 'yellow';
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return 'red';
    case 'overdue':
      return 'red';
    default:
      return 'gray';
  }
};

export const getProfitLossColor = (netIncome: number): string => {
  if (netIncome > 0) return 'green';
  if (netIncome < 0) return 'red';
  return 'gray';
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};
