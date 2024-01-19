import {
    Entity,
    ObjectIdColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Expose, Transform } from "class-transformer";
import { ObjectId } from "mongodb";
import { IsNotEmpty } from "class-validator";

@Entity({ name: 'categories' })
export default class Category {
    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    public _id: ObjectId;

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    public name: string;

    @Column()
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