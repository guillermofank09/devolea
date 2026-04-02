import { Repository, Like } from "typeorm";
import { Player, PlayerCategory, PlayerSex } from "../entities/Player";

export interface CreatePlayerDto {
  name: string;
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string;
  phone?: string;
}

export class PlayerService {
  constructor(private repo: Repository<Player>) {}

  async create(dto: CreatePlayerDto): Promise<Player> {
    const player = this.repo.create(dto);
    return await this.repo.save(player);
  }

  async getAll(search?: string): Promise<Player[]> {
    return await this.repo.find({
      where: search ? { name: Like(`%${search}%`) } : {},
      order: { name: "ASC" },
    });
  }

  async getById(id: number): Promise<Player | null> {
    return await this.repo.findOneBy({ id });
  }

  async update(id: number, dto: Partial<CreatePlayerDto>): Promise<Player | null> {
    await this.repo.update(id, dto);
    return await this.repo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
