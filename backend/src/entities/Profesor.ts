import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Profesor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: "varchar", nullable: true })
  sex?: "MASCULINO" | "FEMENINO";

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (v: object[] | null | undefined) => (v ? JSON.stringify(v) : null),
      from: (v: string | null) => (v ? JSON.parse(v) : null),
    },
  })
  schedule?: object[] | null;

  @Column({ type: "varchar", nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  userId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
