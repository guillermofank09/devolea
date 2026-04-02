import { Repository, Like } from "typeorm";
import { Profesor } from "../entities/Profesor";

export interface CreateProfesorDto {
  name: string;
  phone?: string;
  email?: string;
}

export class ProfesorService {
  constructor(private repo: Repository<Profesor>) {}

  async create(dto: CreateProfesorDto): Promise<Profesor> {
    const profesor = this.repo.create(dto);
    return await this.repo.save(profesor);
  }

  async getAll(search?: string): Promise<Profesor[]> {
    return await this.repo.find({
      where: search ? { name: Like(`%${search}%`) } : {},
      order: { name: "ASC" },
    });
  }

  async getById(id: number): Promise<Profesor | null> {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, dto: Partial<CreateProfesorDto>): Promise<Profesor | null> {
    await this.repo.update(id, dto);
    return await this.repo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
