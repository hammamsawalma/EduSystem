export interface LessonType {
  _id: string;
  teacherId: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  name: string;
  description?: string;
  hourlyRate: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonTypeData {
  teacherId: string;
  name: string;
  description?: string;
  hourlyRate: number;
  currency: string;
  isActive: boolean;
}

export interface UpdateLessonTypeData {
  name?: string;
  description?: string;
  hourlyRate?: number;
  currency?: string;
  isActive?: boolean;
}

export interface TimeEntry {
  _id: string;
  teacherId: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  lessonTypeId: {
    _id: string;
    name: string;
    description?: string;
    hourlyRate: number;
    currency: string;
  };
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  totalAmount: number;
  currency: string;
  description?: string;
  studentId?: {
    _id: string;
    personalInfo: {
      firstName: string;
      lastName: string;
    };
    fullName: string;
    parentContact: string;
    id: string;
  } | null;
  editHistory: {
    previousHours: number;
    previousAmount: number;
    editedBy: string;
    _id: string;
    editedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryData {
  lessonTypeId: string;
  date: string;
  hoursWorked: number;
  description?: string;
  studentId?: string;
}

export interface UpdateTimeEntryData {
  id: string;
  hoursWorked?: number;
  description?: string;
  studentId?: string;
}

export interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Expense {
  _id: string;
  submittedBy: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  isRecurring: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  rejectedAt?: string;
  rejectedBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  rejectionReason?: string;
  formattedAmount: string;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  id: string;
}

export interface CreateExpenseData {
  category: string;
  amount: number;
  currency?: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  tags?: string[];
}

export interface Payment {
  _id: string;
  studentId: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email?: string;
    };
    _id: string;
    fullName: string;
    parentContact: string;
    id: string;
  };
  teacherId: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'online';
  paymentDate: string;
  paymentType: string;
  reference: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  academicPeriod: string;
  dueDate?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  receiptNumber?: string;
  formattedAmount: string;
  netAmount: number;
  paymentAge: number;
  isOverdue: boolean;
  daysOverdue: number;
  id: string;
  refundInfo?: {
    refundAmount: number;
    refundDate: string;
    refundReason: string;
    refundMethod: string;
  };
  relatedAttendance?: {
    _id: string;
    lessonDate: string;
    lessonType: string;
    status: string;
    isPresent: boolean;
    wasLate: boolean;
    needsMakeup: boolean;
    id: string;
  };
}

export interface CreatePaymentData {
  studentId: string;
  amount: number;
  currency?: string;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'online';
  paymentDate: string;
  paymentType?: string;
  reference?: string;
  notes?: string;
  academicPeriod: string;
  dueDate?: string;
  isRecurring?: boolean;
}

export interface FinancialSummary {
  totalEarnings: number;
  totalExpenses: number;
  netIncome: number;
  hoursWorked: number;
  averageHourlyRate: number;
  monthlyTrend: {
    month: string;
    earnings: number;
    expenses: number;
    hours: number;
  }[];
}

export interface EarningsReport {
  period: string;
  totalEarnings: number;
  totalHours: number;
  averageRate: number;
  byLessonType: {
    name: string;
    hours: number;
    earnings: number;
    rate: number;
  }[];
}

export interface ExpensesReport {
  period: string;
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  rejectedExpenses: number;
  byCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
}

export interface EarningsSummary {
  totalEarnings: number;
  totalHours: number;
  averageHourlyRate: number;
  entryCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface EarningsBreakdown {
  _id: {
    lessonTypeId: string;
    name: string;
  };
  totalHours: number;
  totalEarnings: number;
  entryCount: number;
  averageHourlyRate: number;
}

export interface EarningsSummaryResponse {
  summary: EarningsSummary;
  breakdown: EarningsBreakdown[];
}
