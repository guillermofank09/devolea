import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type CourtStatus = "AVAILABLE" | "IN USE" | "NOT AVAILABLE";
export type CourtType = "TECHADA" | "DESCUBIERTA"

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

  @Column({ nullable: true })
  userId?: number;

  @CreateDateColumn()
  createdAt?: Date;
}
