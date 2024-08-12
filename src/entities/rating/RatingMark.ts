import { Field, Int, ObjectType } from 'type-graphql'
import { IsMongoId, IsNumber, Max, Min } from 'class-validator'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'

@ObjectType()
@Entity({ name: 'ratingMarks' })
export default class RatingMark extends Base {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar, { nullable: true })
  public categoryId?: ObjectId

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int)
  public mark: number
}