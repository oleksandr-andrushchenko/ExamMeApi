import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn, } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { ArrayNotEmpty, ArrayUnique, IsEmail, IsEnum, IsMongoId, IsNumber, IsOptional, Length, } from 'class-validator'
import Permission from '../enum/auth/Permission'

@Entity({ name: 'users' })
export default class User {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform((params: { value: ObjectId }) => params.value.toString())
  private id: ObjectId

  @IsOptional()
  @Length(2, 30)
  @Column()
  private name: string

  @IsEmail()
  @Column({ unique: true, nullable: false })
  private email: string

  @Exclude()
  @Length(5, 15)
  @Column({ nullable: false })
  private password: string

  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.REGULAR ] })
  private permissions: Permission[]

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform((params: { value: ObjectId }) => params.value?.toString())
  private creator: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
  private created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
  private updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
  private deleted: Date

  public getId(): ObjectId {
    return this.id
  }

  public setName(name: string | undefined): this {
    this.name = name

    return this
  }

  public getName(): string | undefined {
    return this.name
  }

  public setEmail(email: string): this {
    this.email = email

    return this
  }

  public getEmail(): string {
    return this.email
  }

  public setPassword(password: string): this {
    this.password = password

    return this
  }

  public getPassword(): string {
    return this.password
  }

  public setPermissions(permissions: Permission[]): this {
    this.permissions = permissions

    return this
  }

  public getPermissions(): Permission[] {
    return this.permissions
  }

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }
}
