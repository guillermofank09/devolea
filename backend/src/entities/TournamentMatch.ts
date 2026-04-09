import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Tournament } from "./Tournament";
import { Pair } from "./Pair";
import { Court } from "./Court";

export type MatchStatus = "PENDING" | "COMPLETED" | "BYE";
export type MatchLiveStatus = "IN_PLAY" | "DELAYED" | "EARLY";

@Entity("tournament_match")
export class TournamentMatch {
  @PrimaryGeneratedColumn() id!: number;
  @ManyToOne(() => Tournament, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournamentId" }) tournament!: Tournament;
  @ManyToOne(() => Pair, { nullable: true, eager: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "pair1Id" }) pair1?: Pair | null;
  @ManyToOne(() => Pair, { nullable: true, eager: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "pair2Id" }) pair2?: Pair | null;
  @ManyToOne(() => Court, { nullable: true, eager: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "courtId" }) court?: Court | null;
  @Column({ type: "timestamptz", nullable: true }) scheduledAt?: Date | null;
  @Column() round!: number;
  @Column() matchNumber!: number;
  @Column({ default: "PENDING" }) status!: MatchStatus;
  @Column({ type: "int", nullable: true }) winnerId?: number | null;
  @Column({ type: "varchar", nullable: true }) result?: string | null;
  @Column({ default: false }) isRepechage!: boolean;
  @Column({ type: "varchar", nullable: true }) liveStatus?: MatchLiveStatus | null;
  @Column({ type: "timestamptz", nullable: true }) delayedUntil?: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
