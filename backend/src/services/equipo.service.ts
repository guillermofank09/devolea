import { Repository, ILike } from "typeorm";
import { Equipo } from "../entities/Equipo";

export interface CreateEquipoDto {
  name: string;
  city?: string;
  sex?: "MASCULINO" | "FEMENINO";
  avatarUrl?: string;
}

export class EquipoService {
  constructor(private repo: Repository<Equipo>) {}

  async create(dto: CreateEquipoDto, userId: number): Promise<Equipo> {
    const equipo = this.repo.create({ ...dto, userId });
    return await this.repo.save(equipo);
  }

  async getAll(userId: number, search?: string): Promise<Equipo[]> {
    const where: any = { userId };
    if (search) where.name = ILike(`%${search}%`);
    return await this.repo.find({ where, order: { name: "ASC" } });
  }

  async getById(id: number): Promise<Equipo | null> {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, dto: Partial<CreateEquipoDto>): Promise<Equipo | null> {
    const existing = await this.repo.findOneBy({ id });
    if (!existing) return null;
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
