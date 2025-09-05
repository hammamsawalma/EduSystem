export interface Class {
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
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassData {
  teacherId: string;
  name: string;
  description?: string;
  hourlyRate: number;
  currency: string;
  price?: number;
  isActive: boolean;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  hourlyRate?: number;
  currency?: string;
  price?: number;
  isActive?: boolean;
}

export interface ClassAssignment {
  classId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface AssignStudentsToClassData {
  classId: string;
  studentIds: string[];
}
