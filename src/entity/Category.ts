import {
    Entity,
    ObjectIdColumn,
    ObjectId,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Expose, Transform } from "class-transformer";

@Entity({ name: 'categories' })
export default class Category {
    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    public _id: ObjectId;

    @Column({ unique: true, nullable: false })
    public name: string;

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