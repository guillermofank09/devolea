import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";

const JWT_SECRET = process.env.JWT_SECRET || "devolea_secret_key_change_in_prod";
const JWT_EXPIRES_IN = "7d";

export class AuthService {
  constructor(private repo: Repository<User>) {}

  async register(email: string, name: string, password: string) {
    const existing = await this.repo.findOneBy({ email });
    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = this.repo.create({ email, name, password: hashed });
    await this.repo.save(user);
    const token = this.signToken(user);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string) {
    const user = await this.repo.findOneBy({ email });
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const token = this.signToken(user);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  private signToken(user: User) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}
