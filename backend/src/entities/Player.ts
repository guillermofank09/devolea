import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type PlayerSex = "MASCULINO" | "FEMENINO";
export type PlayerCategory =
  | "PRIMERA"
  | "SEGUNDA"
  | "TERCERA"
  | "CUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SEPTIMA"
  | "SIN_CATEGORIA";

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  category!: PlayerCategory;

  @Column()
  city!: string;

  @Column()
  sex!: PlayerSex;

  @Column({ type: "date" })
  birthDate!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  userId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
