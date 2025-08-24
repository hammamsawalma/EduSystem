export interface Teacher {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
  }
  email: string;
  phone: string;
  subject: string;
  joinDate: string;
  status: string;
}

export type TeacherFormData = Omit<Teacher, '_id' | 'joinDate'> & {
  _id?: string;
  joinDate?: string;
};
