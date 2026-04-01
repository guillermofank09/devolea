import { Repository } from "typeorm";
import { ClubProfile } from "../entities/ClubProfile";

export class ClubProfileService {
  constructor(private repo: Repository<ClubProfile>) {}

  async get(): Promise<ClubProfile> {
    let profile = await this.repo.findOneBy({ id: 1 });
    if (!profile) {
      profile = this.repo.create({ id: 1 });
      await this.repo.save(profile);
    }
    return profile;
  }

  async save(dto: Partial<ClubProfile>): Promise<ClubProfile> {
    await this.repo.save({ ...dto, id: 1 });
    return this.get();
  }
}
