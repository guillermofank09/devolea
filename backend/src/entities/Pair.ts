import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Tournament } from "./Tournament";
import { Player } from "./Player";

@Entity()
export class Pair {
  @PrimaryGeneratedColumn() id!: number;
  @ManyToOne(() => Tournament, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournamentId" }) tournament!: Tournament;
  @ManyToOne(() => Player, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "player1Id" }) player1!: Player;
  @ManyToOne(() => Player, { eager: true, nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "player2Id" }) player2?: Player | null;
  @Column({ default: false }) player1InscriptionPaid!: boolean;
  @Column({ default: false }) player2InscriptionPaid!: boolean;
  @Column({ type: "text", nullable: true }) preferredStartTimes!: string | null;
  @Column({ default: false }) disqualified!: boolean;
}
