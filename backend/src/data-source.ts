import "reflect-metadata";
import { DataSource } from "typeorm";
import { Court } from "./entities/Court";
import { Player } from "./entities/Player";
import { Booking } from "./entities/Booking";
import { Tournament } from "./entities/Tournament";
import { Pair } from "./entities/Pair";
import { TournamentMatch } from "./entities/TournamentMatch";
import { ClubProfile } from "./entities/ClubProfile";
import { AppSettings } from "./entities/AppSettings";
import { User } from "./entities/User";
import { Profesor } from "./entities/Profesor";
import { Equipo } from "./entities/Equipo";

const entities = [Court, Player, Booking, Tournament, Pair, TournamentMatch, ClubProfile, AppSettings, User, Profesor, Equipo];

// Production (Vercel): DATABASE_URL is a Neon connection string (requires SSL).
// Development (Docker): individual DB_* env vars.
export const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities,
      synchronize: true,
      logging: false,
    })
  : new DataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: 5432,
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "postgres",
      database: process.env.DB_NAME || "devoleadb",
      entities,
      synchronize: true,
      logging: false,
    });
