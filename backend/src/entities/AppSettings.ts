import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class AppSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  hourlyRate!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  classHourlyRate!: number;

  @Column({ default: false })
  shareSchedules!: boolean;

  @Column({ default: true })
  showTournaments!: boolean;

  @Column({ default: true })
  showCourts!: boolean;

  @Column({ default: true })
  showProfesores!: boolean;

  @Column({ type: "int", default: 60 })
  tournamentMatchDuration!: number;

  @Column({ type: "int", default: 3 })
  tournamentSetsCount!: number;

  @Column({ type: "text", nullable: true })
  sportPricesJson?: string;

  @Column({ type: "text", nullable: true })
  sportClassPricesJson?: string;

  @Column({ nullable: true })
  userId?: number;
}
