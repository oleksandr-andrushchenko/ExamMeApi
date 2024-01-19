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
    public _id: ObjectId;

    @Column({ enum: TokenType, nullable: false })
    public type: string;

    @Exclude()
    @Column({ nullable: false })
    public value: string;

    @Column({ nullable: false })
    public userId: ObjectId;

    @Column()
    public expires: number;

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
