import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ClubProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  clubName!: string;

  @Column({ type: "text", nullable: true })
  logoBase64!: string;

  @Column({ type: "varchar", nullable: true })
  logoUrl!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: "float", nullable: true })
  latitude!: number;

  @Column({ type: "float", nullable: true })
  longitude!: number;

  @Column({ type: "varchar", nullable: true })
  phone!: string;

  @Column({ type: "text", nullable: true })
  businessHoursJson!: string;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (v: string[] | null | undefined) => (v?.length ? JSON.stringify(v) : null),
      from: (v: string | null) => { try { return v ? JSON.parse(v) : []; } catch { return []; } },
    },
  })
  amenities!: string[];

  @Column({ nullable: true })
  userId?: number;
}
