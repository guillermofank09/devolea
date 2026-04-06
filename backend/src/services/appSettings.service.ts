import { Repository } from "typeorm";
import { AppSettings } from "../entities/AppSettings";

export class AppSettingsService {
  constructor(private repo: Repository<AppSettings>) {}

  async get(userId: number): Promise<AppSettings> {
    let settings = await this.repo.findOneBy({ userId });
    if (!settings) {
      settings = this.repo.create({ userId });
      await this.repo.save(settings);
    }
    return settings;
  }

  async save(dto: Partial<AppSettings>, userId: number): Promise<AppSettings> {
    const existing = await this.repo.findOneBy({ userId });
    if (existing) {
      await this.repo.update(existing.id, { ...dto, userId });
    } else {
      await this.repo.save(this.repo.create({ ...dto, userId }));
    }
    return this.get(userId);
  }
}
