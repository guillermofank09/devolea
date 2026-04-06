import { Repository } from "typeorm";
import { ClubProfile } from "../entities/ClubProfile";

export class ClubProfileService {
  constructor(private repo: Repository<ClubProfile>) {}

  async get(userId: number): Promise<ClubProfile> {
    let profile = await this.repo.findOneBy({ userId });
    if (!profile) {
      profile = this.repo.create({ userId });
      await this.repo.save(profile);
    }
    return profile;
  }

  async save(dto: Partial<ClubProfile>, userId: number): Promise<ClubProfile> {
    const existing = await this.repo.findOneBy({ userId });
    if (existing) {
      await this.repo.update(existing.id, { ...dto, userId });
    } else {
      await this.repo.save(this.repo.create({ ...dto, userId }));
    }
    return this.get(userId);
  }
}
