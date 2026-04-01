import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type PlayerSex = "MASCULINO" | "FEMENINO";
export type PlayerCategory =
  | "PRIMERA"
  | "SEGUNDA"
  | "TERCERA"
  | "CUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SEPTIMA";

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

  @CreateDateColumn()
  createdAt!: Date;
}
