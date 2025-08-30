export interface Student {
  id: string;
  _id: string;
  // First and last name
  firstName: string;
  lastName: string;
  // Primary phone number
  primaryPhone: string;
  // Secondary contact (parent, sibling, etc.)
  secondaryContact: {
    name: string;
    relationship: 'parent' | 'sibling' | 'guardian' | 'relative' | 'other';
    phone: string;
  };
  // Email
  email: string;
  // Address
  address: string;
  // National ID (mandatory)
  nationalId: string;
  // The level they are enrolled in
  level: string;
  // The assigned teacher (can be reassigned later)
  teacherId: {
    profile: {
      firstName: string;
      lastName: string;
    };
    _id: string;
    email: string;
  };
  // Enrollment and status information
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'suspended';
  // Optional fields
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  fullName: string;
  secondaryContactInfo: string;
}

export interface CreateStudentData {
  // First and last name
  firstName: string;
  lastName: string;
  // Primary phone number
  primaryPhone: string;
  // Secondary contact (parent, sibling, etc.)
  secondaryContact: {
    name: string;
    relationship: 'parent' | 'sibling' | 'guardian' | 'relative' | 'other';
    phone: string;
  };
  // Email
  email: string;
  // Address
  address: string;
  // National ID (mandatory)
  nationalId: string;
  // The level they are enrolled in
  level: string;
  // The assigned teacher (can be reassigned later)
  teacherId: string;
  // Optional fields
  notes?: string;
  enrollmentDate?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  id: string;
  status?: 'active' | 'inactive' | 'suspended';
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
  level?: string;
  teacherId?: string;
  page?: number;
  limit?: number;
}

export interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  suspendedStudents: number;
}
