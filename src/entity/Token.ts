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

export enum TokenType {
    ACCESS = 'access',
}

@Entity({ name: 'tokens' })
export default class Token {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    private _id: ObjectId;

    public getId(): ObjectId {
        return this._id;
    }

    @Column({ enum: TokenType, nullable: false })
    private type: string;

    public setType(type: string): this {
        this.type = type;

        return this;
    }

    public getType(): string {
        return this.type;
    }

    @Exclude()
    @Column({ nullable: false })
    private value: string;

    public setValue(value: string): this {
        this.value = value;

        return this;
    }

    public getValue(): string {
        return this.value;
    }

    @Column({ nullable: false })
    private userId: ObjectId;

    public setUserId(userId: ObjectId): this {
        this.userId = userId;

        return this;
    }

    public getUserId(): ObjectId {
        return this.userId;
    }

    @Column()
    private expires: number;

    public setExpires(expires: number): this {
        this.expires = expires;

        return this;
    }

    public getExpires(): number {
        return this.expires;
    }

    @Column()
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
