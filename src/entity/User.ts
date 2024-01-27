import {
    Entity,
    ObjectIdColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Exclude, Expose, Transform } from "class-transformer";
import { ObjectId } from "mongodb";
import { IsNotEmpty } from "class-validator";

@Entity({ name: 'users' })
export default class User {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    public _id: ObjectId;

    @IsNotEmpty()
    @Column({ nullable: false })
    public name: string;

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    public email: string;

    @Exclude()
    @Column({ nullable: false })
    public password: string;

    @Exclude()
    @Column()
    @Transform((params: { value: ObjectId }) => params.value?.toString())
    public createdBy: ObjectId;

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
