import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class AppSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  hourlyRate!: number;

  @Column({ default: false })
  shareSchedules!: boolean;
}
