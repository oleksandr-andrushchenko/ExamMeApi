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

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    private name: string;

    @Exclude()
    @Column()
    @Transform((params: { value: ObjectId }) => params.value?.toString())
    private creator: ObjectId;

    @Column()
    @CreateDateColumn()
    private created: Date;

    @Column()
    @UpdateDateColumn()
    private updated: Date;

    @Column()
    @DeleteDateColumn()
    private deleted: Date;

    public getId(): ObjectId {
        return this._id;
    }

    public setName(name: string): this {
        this.name = name;

        return this;
    }

    public getName(): string {
        return this.name;
    }

    public setCreator(creator: ObjectId): this {
        this.creator = creator;

        return this;
    }

    public getCreator(): ObjectId {
        return this.creator;
    }
}