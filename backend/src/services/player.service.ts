import { Repository, ILike } from "typeorm";
import { Player, PlayerCategory, PlayerSex } from "../entities/Player";

export interface CreatePlayerDto {
  name: string;
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string;
  phone?: string;
  sport?: string;
  avatarUrl?: string;
}

export class PlayerService {
  constructor(private repo: Repository<Player>) {}

  async create(dto: CreatePlayerDto, userId: number): Promise<Player> {
    const player = this.repo.create({ ...dto, userId });
    return await this.repo.save(player);
  }

  async getAll(userId: number, search?: string): Promise<Player[]> {
    const where: any = { userId };
    if (search) where.name = ILike(`%${search}%`);
    return await this.repo.find({ where, order: { name: "ASC" } });
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
