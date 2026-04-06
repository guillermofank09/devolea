import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type TournamentStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type TournamentFormat = "ROUND_ROBIN" | "BRACKET";
export type TournamentCategory = "PRIMERA" | "SEGUNDA" | "TERCERA" | "CUARTA" | "QUINTA" | "SEXTA" | "SEPTIMA";

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn() id!: number;
  @Column() name!: string;
  @Column() category!: TournamentCategory;
  @Column({ type: "date" }) startDate!: string;
  @Column({ type: "date" }) endDate!: string;
  @Column({ default: "DRAFT" }) status!: TournamentStatus;
  @Column({ type: "varchar", nullable: true }) format?: TournamentFormat;
  @Column({ nullable: true }) userId?: number;
  @CreateDateColumn() createdAt!: Date;
}
