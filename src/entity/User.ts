import {
    Entity,
    ObjectIdColumn,
    ObjectId,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Exclude, Expose, Transform } from "class-transformer";

@Entity({ name: 'users' })
export default class User {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    public _id: ObjectId;

    @Column({ nullable: false })
    public name: string;

    @Column({ unique: true, nullable: false })
    public email: string;

    @Exclude()
    @Column({ nullable: false })
    public password: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @Column()
    @DeleteDateColumn()
    public deletedAt: Date;
}
