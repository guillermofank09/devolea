import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type CourtStatus = "AVAILABLE" | "IN USE" | "NOT AVAILABLE";
export type CourtType = "TECHADA" | "DESCUBIERTA" | "FUTBOL5" | "FUTBOL7" | "FUTBOL9" | "FUTBOL11" | "CEMENTO" | "PARQUET"

@Entity()
export class Court {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column()
  status?: CourtStatus;

  @Column({ default: "TECHADA" })
  type?: CourtType;

  @Column({ type: "varchar", nullable: true, default: "PADEL" })
  sport?: string;

  @Column({ nullable: true })
  userId?: number;

  @CreateDateColumn()
  createdAt?: Date;
}
