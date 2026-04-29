import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";

const JWT_SECRET = process.env.JWT_SECRET || "devolea_secret_key_change_in_prod";
const JWT_EXPIRES_IN = "7d";
const DEFAULT_TRIAL_DAYS = 14;

export class AuthService {
  constructor(private repo: Repository<User>) {}

  private toUserDto(user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastPaymentDate: user.lastPaymentDate ?? null,
      trialEndsAt: user.trialEndsAt ?? null,
      sports: user.sports ?? ["PADEL"],
      createdAt: user.createdAt,
    };
  }

  private isTrialExpired(user: User): boolean {
    if (!user.trialEndsAt) return false;
    const end = new Date(user.trialEndsAt + "T23:59:59");
    return end < new Date();
  }

  private trialEndDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  async login(username: string, password: string) {
    const user = await this.repo.findOneBy({ username });
    if (!user) throw new Error("INVALID_CREDENTIALS");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_CREDENTIALS");
    if (!user.isActive) throw new Error("ACCOUNT_DISABLED");
    if (user.role !== "superadmin" && this.isTrialExpired(user)) throw new Error("TRIAL_EXPIRED");
    const token = this.signToken(user);
    return { token, user: this.toUserDto(user) };
  }

  async getMe(userId: number) {
    const user = await this.repo.findOneBy({ id: userId });
    if (!user) throw new Error("NOT_FOUND");
    if (!user.isActive) throw new Error("ACCOUNT_DISABLED");
    if (user.role !== "superadmin" && this.isTrialExpired(user)) throw new Error("TRIAL_EXPIRED");
    return this.toUserDto(user);
  }

  async createUser(username: string, name: string, password: string, role: "user" | "superadmin" = "user", sports: string[] = ["PADEL"]) {
    const existing = await this.repo.findOneBy({ username });
    if (existing) throw new Error("USERNAME_TAKEN");
    const hashed = await bcrypt.hash(password, 10);
    const trialEndsAt = role === "user" ? this.trialEndDate(DEFAULT_TRIAL_DAYS) : null;
    const user = this.repo.create({ username, name, password: hashed, role, sports, trialEndsAt });
    await this.repo.save(user);
    return this.toUserDto(user);
  }

  async getUsers() {
    const users = await this.repo.find({ order: { createdAt: "ASC" } });
    return users.map(u => this.toUserDto(u));
  }

  async updateUser(id: number, dto: {
    name?: string;
    password?: string;
    isActive?: boolean;
    lastPaymentDate?: string | null;
    trialEndsAt?: string | null;
    sports?: string[];
  }) {
    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.password) update.password = await bcrypt.hash(dto.password, 10);
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    if ("lastPaymentDate" in dto) update.lastPaymentDate = dto.lastPaymentDate ?? null;
    if ("trialEndsAt" in dto) update.trialEndsAt = dto.trialEndsAt ?? null;
    if (dto.sports !== undefined) update.sports = dto.sports;
    await this.repo.update(id, update);
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new Error("NOT_FOUND");
    return this.toUserDto(user);
  }

  async impersonateUser(targetId: number) {
    const user = await this.repo.findOneBy({ id: targetId });
    if (!user) throw new Error("NOT_FOUND");
    if (!user.isActive) throw new Error("ACCOUNT_DISABLED");
    const token = this.signToken(user);
    return { token, user: this.toUserDto(user) };
  }

  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new Error("NOT_FOUND");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("WRONG_PASSWORD");
    user.password = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
  }

  async deleteUser(id: number) {
    await this.repo.delete(id);
  }

  async initSuperAdmin(username: string, name: string, password: string) {
    const count = await this.repo.count();
    if (count > 0) throw new Error("ALREADY_INITIALIZED");
    return this.createUser(username, name, password, "superadmin");
  }

  private signToken(user: User) {
    return jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
}
