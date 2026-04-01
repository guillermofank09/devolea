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

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "devoleadb",
  entities: [Court, Player, Booking, Tournament, Pair, TournamentMatch, ClubProfile, AppSettings, User],
  synchronize: true,
  logging: false,
});
