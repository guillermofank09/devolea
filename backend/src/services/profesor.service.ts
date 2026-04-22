import { Repository, ILike } from "typeorm";
import { Profesor } from "../entities/Profesor";

export interface CreateProfesorDto {
  name: string;
  phone?: string;
  hourlyRate?: number;
  sex?: "MASCULINO" | "FEMENINO";
  schedule?: object[];
  avatarUrl?: string;
  sport?: string;
  birthDate?: string;
}

export class ProfesorService {
  constructor(private repo: Repository<Profesor>) {}

  async create(dto: CreateProfesorDto, userId: number): Promise<Profesor> {
    const profesor = this.repo.create({ ...dto, userId });
    return await this.repo.save(profesor);
  }

  async getAll(userId: number, search?: string): Promise<Profesor[]> {
    const where: any = { userId };
    if (search) where.name = ILike(`%${search}%`);
    return await this.repo.find({ where, order: { name: "ASC" } });
  }

  async getById(id: number): Promise<Profesor | null> {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, dto: Partial<CreateProfesorDto>): Promise<Profesor | null> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
