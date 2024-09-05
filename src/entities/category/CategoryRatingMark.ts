import { Field, Int, ObjectType } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, Max, Min } from 'class-validator'

@ObjectType()
@Entity({ name: 'categoryRatingMarks' })
export default class CategoryRatingMark extends Base {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int)
  public mark: number
}