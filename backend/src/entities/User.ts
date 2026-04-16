import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({ default: "user" })
  role!: "superadmin" | "user";

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "date", nullable: true, default: null })
  lastPaymentDate!: string | null;

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (v: string[] | null | undefined) => (v?.length ? JSON.stringify(v) : JSON.stringify(["PADEL"])),
      from: (v: string | null) => { try { return v ? JSON.parse(v) : ["PADEL"]; } catch { return ["PADEL"]; } },
    },
  })
  sports!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
