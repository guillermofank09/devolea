export interface Profesor {
  id: number;
  name: string;
  phone?: string;
  hourlyRate?: number;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
}
