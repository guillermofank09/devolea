export interface Profesor {
  id: number;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
}
