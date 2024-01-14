import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity({ name: 'categories' })
export class Category {

    @ObjectIdColumn()
    public id: ObjectId;

    @Column({
        unique: true,
        nullable: false,
    })
    public name: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;
}
