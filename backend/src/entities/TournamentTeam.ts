import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Tournament } from "./Tournament";
import { Equipo } from "./Equipo";

@Entity("tournament_team")
export class TournamentTeam {
  @PrimaryGeneratedColumn() id!: number;
  @ManyToOne(() => Tournament, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournamentId" }) tournament!: Tournament;
  @ManyToOne(() => Equipo, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "equipoId" }) equipo!: Equipo;
  @Column({ default: false }) disqualified!: boolean;
}
