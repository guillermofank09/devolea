import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ClubProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  clubName!: string;

  @Column({ type: "text", nullable: true })
  logoBase64!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: "float", nullable: true })
  latitude!: number;

  @Column({ type: "float", nullable: true })
  longitude!: number;

  @Column({ type: "text", nullable: true })
  businessHoursJson!: string;
}
