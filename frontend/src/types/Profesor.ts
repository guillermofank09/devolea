export interface Profesor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
  email: string;
}
