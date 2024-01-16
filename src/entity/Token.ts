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

export enum TokenType {
    ACCESS = 'access',
    REFRESH = 'refresh',
    RESET_PASSWORD = 'resetPassword',
    VERIFY_EMAIL = 'verifyEmail',
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
    public userId: string;

    @Column()
    public expires: number;

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
