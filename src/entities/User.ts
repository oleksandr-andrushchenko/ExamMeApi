import { Column, Entity, ObjectIdColumn } from 'typeorm'
import { ObjectId } from 'mongodb'
import { ArrayNotEmpty, ArrayUnique, IsEmail, IsEnum, IsMongoId, IsNumber, IsOptional, Length } from 'class-validator'
import Permission from '../enums/Permission'
import { Field, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import { GraphQLTimestamp } from 'graphql-scalars'

@ObjectType()
@Entity({ name: 'users' })
export default class User {

  @IsMongoId()
  @ObjectIdColumn()
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

  @Length(5, 15)
  @Column()
  public password: string

  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.REGULAR ] })
  @Field(_type => [ String! ], { defaultValue: [ Permission.REGULAR ] })
  public permissions: Permission[] = [ Permission.REGULAR ]

  @IsMongoId()
  @Column()
  public creatorId: ObjectId

  @IsNumber()
  @Column({ update: false })
  @Field(_type => GraphQLTimestamp)
  public createdAt: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true, insert: false })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updatedAt?: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true, insert: false })
  public deletedAt?: Date
}
