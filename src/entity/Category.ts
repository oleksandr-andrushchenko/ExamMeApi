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

@Entity({ name: 'categories' })
export default class Category {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    private _id: ObjectId;

    public getId(): ObjectId {
        return this._id;
    }

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    private name: string;

    public setName(name: string): this {
        this.name = name;

        return this;
    }

    public getName(): string {
        return this.name;
    }

    @Exclude()
    @Column()
    @Transform((params: { value: ObjectId }) => params.value?.toString())
    private createdBy: ObjectId;

    public setCreatedBy(createdBy: ObjectId): this {
        this.createdBy = createdBy;

        return this;
    }

    public getCreatedBy(): ObjectId {
        return this.createdBy;
    }

    @Column()
    @CreateDateColumn()
    private createdAt: Date;

    @Column()
    @UpdateDateColumn()
    private updatedAt: Date;

    @Column()
    @DeleteDateColumn()
    private deletedAt: Date;
}