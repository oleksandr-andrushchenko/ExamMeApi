import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform } from 'class-transformer'
import { ObjectId } from 'mongodb'
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsDate,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Length,
} from 'class-validator'
import Permission from '../enums/Permission'
import { Field, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import { GraphQLTimestamp } from 'graphql-scalars'

@ObjectType()
@Entity({ name: 'users' })
export default class User {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @IsOptional()
  @Length(2, 30)
  @Column({ nullable: true })
  @Field({ nullable: true })
  public name?: string

  @IsEmail()
  @Column({ unique: true })
  @Field()
  public email: string

  @Exclude()
  @Length(5, 15)
  @Column()
  public password: string

  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.REGULAR ] })
  @Field(_type => [ String! ], { defaultValue: [ Permission.REGULAR ] })
  public permissions: Permission[] = [ Permission.REGULAR ]

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public creator: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value.getTime())
  @Field(_type => GraphQLTimestamp)
  public created: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true })
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updated?: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column({ nullable: true })
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public deleted?: Date
}
