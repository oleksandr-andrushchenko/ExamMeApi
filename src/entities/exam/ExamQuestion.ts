import { Field, Int, ObjectType } from 'type-graphql'
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator'
import { Column } from 'typeorm'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'

@ObjectType()
export default class ExamQuestion {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public questionId: ObjectId

  @IsOptional()
  @IsNumber()
  @Column()
  @Field(_type => Int, { nullable: true })
  public choice?: number

  @IsOptional()
  @IsString()
  @Column()
  @Field({ nullable: true })
  public answer?: string
}