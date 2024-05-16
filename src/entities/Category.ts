import { Column, Entity, ObjectIdColumn } from 'typeorm'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, IsOptional, Length, Max, Min } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import { GraphQLTimestamp } from 'graphql-scalars'

@ObjectType()
@Entity({ name: 'categories' })
export default class Category {

  @IsMongoId()
  @ObjectIdColumn()
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @Length(3, 100)
  @Column({ unique: true })
  @Field()
  public name: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  @Field(_type => Int)
  public questionCount: number = 0

  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public requiredScore?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public voters?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public rating?: number = 0

  @IsMongoId()
  @Column()
  public creatorId: ObjectId

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public ownerId: ObjectId

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