export interface Student {
  id: string;
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  };
  parentInfo: {
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    emergencyContact?: string;
  };
  academicInfo: {
    grade?: string;
    subjects?: string[];
    learningPreferences?: string;
    specialNeeds?: string;
  };
  paymentInfo: {
    paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online';
    paymentSchedule?: 'weekly' | 'monthly' | 'quarterly';
    currentBalance: number;
    totalPaid: number;
  };
  teacherId: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  parentContact: string;
}

export interface CreateStudentData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  };
  parentInfo?: {
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    emergencyContact?: string;
  };
  academicInfo?: {
    grade?: string;
    subjects?: string[];
    learningPreferences?: string;
    specialNeeds?: string;
  };
  paymentInfo?: {
    paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online';
    paymentSchedule?: 'weekly' | 'monthly' | 'quarterly';
    currentBalance?: number;
    totalPaid?: number;
  };
  notes?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  id: string;
}

export interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StudentFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  grade?: string;
  paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online';
  page?: number;
  limit?: number;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  suspendedStudents: number;
  totalRevenue: number;
  pendingPayments: number;
  averageBalance: number;
}
