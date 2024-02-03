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
import { Permission } from "../type/auth/Permission";

@Entity({ name: 'users' })
export default class User {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    private _id: ObjectId;

    @IsNotEmpty()
    @Column({ nullable: false })
    private name: string;

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    private email: string;

    @Exclude()
    @Column({ nullable: false })
    private password: string;

    @Column({ type: 'set', enum: Permission, default: [Permission.REGULAR] })
    private permissions: Permission[];

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

    public setEmail(email: string): this {
        this.email = email;

        return this;
    }

    public getEmail(): string {
        return this.email;
    }

    public setPassword(password: string): this {
        this.password = password;

        return this;
    }

    public getPassword(): string {
        return this.password;
    }

    public setPermissions(permissions: Permission[]): this {
        this.permissions = permissions;

        return this;
    }

    public getPermissions(): Permission[] {
        return this.permissions;
    }

    public setCreator(creator: ObjectId): this {
        this.creator = creator;

        return this;
    }

    public getCreator(): ObjectId {
        return this.creator;
    }
}
