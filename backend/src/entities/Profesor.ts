import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Profesor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
