import { Repository, Like } from "typeorm";
import { Profesor } from "../entities/Profesor";

export interface CreateProfesorDto {
  name: string;
  phone?: string;
}

export class ProfesorService {
  constructor(private repo: Repository<Profesor>) {}

  async create(dto: CreateProfesorDto, userId: number): Promise<Profesor> {
    const profesor = this.repo.create({ ...dto, userId });
    return await this.repo.save(profesor);
  }

  async getAll(userId: number, search?: string): Promise<Profesor[]> {
    const where: any = { userId };
    if (search) where.name = Like(`%${search}%`);
    return await this.repo.find({ where, order: { name: "ASC" } });
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
