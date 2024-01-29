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

    public getId(): ObjectId {
        return this._id;
    }

    @IsNotEmpty()
    @Column({ nullable: false })
    private name: string;

    public setName(name: string): this {
        this.name = name;

        return this;
    }

    public getName(): string {
        return this.name;
    }

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    private email: string;

    public setEmail(email: string): this {
        this.email = email;

        return this;
    }

    public getEmail(): string {
        return this.email;
    }

    @Exclude()
    @Column({ nullable: false })
    private password: string;

    public setPassword(password: string): this {
        this.password = password;

        return this;
    }

    public getPassword(): string {
        return this.password;
    }

    @Column({ default: [Permission.REGULAR] })
    private permissions: Permission[];

    public setPermissions(permissions: Permission[]): this {
        this.permissions = permissions;

        return this;
    }

    public getPermissions(): Permission[] {
        return this.permissions;
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
