import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Court } from "./Court";
import { Player } from "./Player";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Court, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "courtId" })
  court!: Court;

  @ManyToOne(() => Player, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "playerId" })
  player!: Player;

  @Column({ type: "timestamptz" })
  startTime!: Date;

  @Column({ type: "timestamptz" })
  endTime!: Date;

  @Column({ default: "CONFIRMED" })
  status!: BookingStatus;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ type: "varchar", nullable: true })
  recurringGroupId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
