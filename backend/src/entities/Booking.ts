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
import { Profesor } from "./Profesor";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Court, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "courtId" })
  court!: Court;

  @ManyToOne(() => Player, { nullable: true, onDelete: "SET NULL", eager: true })
  @JoinColumn({ name: "playerId" })
  player?: Player | null;

  @ManyToOne(() => Profesor, { nullable: true, onDelete: "SET NULL", eager: true })
  @JoinColumn({ name: "profesorId" })
  profesor?: Profesor | null;

  @Column({ type: "timestamptz" })
  startTime!: Date;

  @Column({ type: "timestamptz" })
  endTime!: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number | null;

  @Column({ default: "CONFIRMED" })
  status!: BookingStatus;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ type: "varchar", nullable: true })
  recurringGroupId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
