import { Repository } from "typeorm";
import { AppSettings } from "../entities/AppSettings";

export class AppSettingsService {
  constructor(private repo: Repository<AppSettings>) {}

  async get(): Promise<AppSettings> {
    let settings = await this.repo.findOneBy({ id: 1 });
    if (!settings) {
      settings = this.repo.create({ id: 1 });
      await this.repo.save(settings);
    }
    return settings;
  }

  async save(dto: Partial<AppSettings>): Promise<AppSettings> {
    await this.repo.save({ ...dto, id: 1 });
    return this.get();
  }
}
