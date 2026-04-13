import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";

const JWT_SECRET = process.env.JWT_SECRET || "devolea_secret_key_change_in_prod";
const JWT_EXPIRES_IN = "7d";

export class AuthService {
  constructor(private repo: Repository<User>) {}

  async login(username: string, password: string) {
    const user = await this.repo.findOneBy({ username });
    if (!user) throw new Error("INVALID_CREDENTIALS");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("INVALID_CREDENTIALS");
    const token = this.signToken(user);
    return { token, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
  }

  async createUser(username: string, name: string, password: string, role: "user" | "superadmin" = "user") {
    const existing = await this.repo.findOneBy({ username });
    if (existing) throw new Error("USERNAME_TAKEN");
    const hashed = await bcrypt.hash(password, 10);
    const user = this.repo.create({ username, name, password: hashed, role });
    await this.repo.save(user);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastPaymentDate: user.lastPaymentDate ?? null,
      createdAt: user.createdAt,
    };
  }

  async getUsers() {
    const users = await this.repo.find({ order: { createdAt: "ASC" } });
    return users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      lastPaymentDate: u.lastPaymentDate ?? null,
      createdAt: u.createdAt,
    }));
  }

  async updateUser(id: number, dto: { name?: string; password?: string; isActive?: boolean; lastPaymentDate?: string | null }) {
    const update: Partial<User> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.password) update.password = await bcrypt.hash(dto.password, 10);
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    if ("lastPaymentDate" in dto) update.lastPaymentDate = dto.lastPaymentDate ?? null;
    await this.repo.update(id, update);
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new Error("NOT_FOUND");
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastPaymentDate: user.lastPaymentDate ?? null,
      createdAt: user.createdAt,
    };
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
