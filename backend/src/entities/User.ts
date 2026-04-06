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

  @CreateDateColumn()
  createdAt!: Date;
}
