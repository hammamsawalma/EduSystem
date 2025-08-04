export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  joinDate: string;
  status: string;
}

export type TeacherFormData = Omit<Teacher, 'id' | 'joinDate'> & {
  id?: number;
  joinDate?: string;
};
