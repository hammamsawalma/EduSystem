// Import existing types
import type { Student } from './student';
import type { Teacher } from './teacher';
import type { User } from './auth';
import type { Payment, TimeEntry } from './financial';

// Define a basic Expense interface if it doesn't exist
interface Expense {
  _id: string;
  submittedBy: string | User;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receiptUrl?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string | User;
  approvedAt?: string;
  rejectedBy?: string | User;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Teacher Payment Types
export interface TeacherPayment {
  _id: string;
  teacherId: string | Teacher;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'online' | 'card' | 'mobile_payment';
  paymentDate: string;
  paymentType: 'salary' | 'hourly_payment' | 'bonus' | 'commission' | 'reimbursement' | 'advance' | 'other';
  hoursWorked?: number;
  hourlyRate?: number;
  description?: string;
  reference?: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approvedBy?: string | User;
  approvedAt?: string;
  paidAt?: string;
  receiptNumber?: string;
  notes?: string;
  submittedBy: string | User;
  createdAt: string;
  updatedAt: string;
  formattedAmount: string;
  isOverdue: boolean;
}

export interface TeacherPaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
  totalCancelled: number;
  countPaid: number;
  countPending: number;
  countApproved: number;
  countCancelled: number;
  pendingFromHours?: number;
}

export interface CreateTeacherPaymentRequest {
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentDate: string;
  paymentType: string;
  hoursWorked?: number;
  hourlyRate?: number;
  description?: string;
  reference?: string;
}

// Financial Report Types
export interface FinancialReport {
  _id: string;
  reportDate: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: string;
  periodEnd: string;
  revenue: {
    studentPayments: {
      total: number;
      received: number;
      pending: number;
      overdue: number;
    };
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    teacherPayments: {
      total: number;
      paid: number;
      pending: number;
    };
    generalExpenses: {
      rent: number;
      utilities: number;
      supplies: number;
      marketing: number;
      maintenance: number;
      insurance: number;
      other: number;
      total: number;
    };
    totalExpenses: number;
  };
  netIncome: number;
  profitMargin: number;
  studentMetrics: {
    totalStudents: number;
    activeStudents: number;
    newStudents: number;
    revenuePerStudent: number;
  };
  teacherMetrics: {
    totalTeachers: number;
    activeTeachers: number;
    totalHoursWorked: number;
    averageHourlyRate: number;
  };
  generatedBy: string | User;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  profitLossStatus: 'profit' | 'loss' | 'breakeven';
  formattedNetIncome: string;
}

export interface GenerateReportRequest {
  startDate: string;
  endDate: string;
  reportType?: string;
}

// Accounting Types
export interface StudentAccountingData {
  student: {
    _id: string;
    name: string;
    email: string;
    level: string;
    enrollmentDate: string;
    teacher: Teacher;
  };
  financials: {
    estimatedTotalFee: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    remainingBalance: number;
    paymentHistory: number;
  };
}

export interface StudentAccountingResponse {
  students: StudentAccountingData[];
  totals: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalRemaining: number;
  };
  period: {
    start: string;
    end: string;
  };
  studentCount: number;
}

export interface TeacherAccountingData {
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  hours: {
    totalHours: number;
    totalEarnings: number;
  };
  payments: {
    totalPaid: number;
    totalPending: number;
    unpaidEarnings: number;
  };
  status: {
    isPaidUp: boolean;
    deficitAmount: number;
  };
}

export interface TeacherAccountingResponse {
  teachers: TeacherAccountingData[];
  totals: {
    totalHours: number;
    totalEarnings: number;
    totalPaid: number;
    totalPending: number;
    totalUnpaid: number;
    totalDeficit: number;
  };
  period: {
    start: string;
    end: string;
  };
  teacherCount: number;
}

export interface ProfitLossSummary {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    studentPayments: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    teacherPayments: number;
    generalExpenses: number;
    breakdown: Array<{
      _id: string;
      total: number;
      count: number;
    }>;
    total: number;
  };
  netIncome: number;
  profitMargin: number;
  status: 'profit' | 'loss' | 'breakeven';
  metrics: {
    revenueCount: number;
    teacherPaymentCount: number;
    generalExpenseCount: number;
  };
}

export interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  runningTotal: number;
  details: {
    teacherPayments: number;
    generalExpenses: number;
  };
}

export interface CashFlowResponse {
  cashFlow: CashFlowData[];
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    finalBalance: number;
  };
}

// Enhanced Expense Types
export interface EnhancedExpense extends Expense {
  category: 'rent' | 'utilities' | 'supplies' | 'marketing' | 'maintenance' | 
           'insurance' | 'salaries' | 'transportation' | 'communication' | 
           'software' | 'equipment' | 'training' | 'legal' | 'accounting' | 'other';
  subcategory?: string;
}

export interface ExpensesByCategory {
  _id: string;
  totalAmount: number;
  count: number;
  avgAmount: number;
}

export interface GeneralExpensesResponse {
  expenses: EnhancedExpense[];
  byCategory: ExpensesByCategory[];
  monthlyBreakdown: Array<{
    _id: {
      year: number;
      month: number;
    };
    totalAmount: number;
    count: number;
  }>;
  totals: {
    totalAmount: number;
    count: number;
  };
  period: {
    start: string;
    end: string;
  };
}

// Teacher Management Types
export interface TeacherWithPaymentSummary extends Teacher {
  paymentSummary: {
    toTeacher: TeacherPaymentSummary;
    fromStudents: any; // From existing PaymentOverview type
    netBalance: number;
  };
  hoursSummary: {
    totalHours: number;
    totalEarnings: number;
    entryCount: number;
  };
  studentCount: number;
}

export interface TeacherDetailsResponse {
  teacher: Teacher;
  paymentSummary: {
    toTeacher: TeacherPaymentSummary & { pendingFromHours: number };
    fromStudents: any;
    netBalance: number;
  };
  hoursSummary: {
    totalHours: number;
    totalEarnings: number;
    entryCount: number;
  };
  teacherPayments: TeacherPayment[];
  studentPayments: Payment[];
  timeEntries: TimeEntry[];
  students: Student[];
  studentCount: number;
}

export interface HoursAnalysis {
  period: {
    start: string;
    end: string;
  };
  hours: {
    totalHours: number;
    totalEarnings: number;
  };
  payments: {
    totalPaid: number;
    totalPending: number;
    unpaidEarnings: number;
  };
  status: {
    isPaidUp: boolean;
    owedAmount: number;
    paymentCoverage: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  summary?: any;
  totals?: any;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

// Re-export existing types
export * from './student';
export * from './teacher';
export * from './auth';
export * from './class';
export * from './financial';
