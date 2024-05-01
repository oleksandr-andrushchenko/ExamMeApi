import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { ArrayNotEmpty, ArrayUnique, IsEmail, IsEnum, IsMongoId, IsNumber, IsOptional, Length } from 'class-validator'
import Permission from '../enum/Permission'

@Entity({ name: 'users' })
export default class User {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  public readonly id: ObjectId

  @IsOptional()
  @Length(2, 30)
  @Column()
  public name: string

  @IsEmail()
  @Column({ unique: true })
  public email: string

  @Exclude()
  @Length(5, 15)
  @Column()
  public password: string

  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.REGULAR ] })
  public permissions: Permission[]

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public creator: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public deleted: Date
}
