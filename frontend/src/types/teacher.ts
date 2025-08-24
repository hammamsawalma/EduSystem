export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  joinDate: string;
  status: string;
}

export type TeacherFormData = Omit<Teacher, 'id' | 'joinDate'> & {
  id?: string;
  joinDate?: string;
};
