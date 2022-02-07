import sequelize from 'sequelize';
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @Column({
    defaultValue: sequelize.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({})
  email: string;

  @Column({})
  hash: string;

  @Column({})
  hashedRt?: string;
}
