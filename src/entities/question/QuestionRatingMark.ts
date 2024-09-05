import { Field, Int, ObjectType } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'
import { IsMongoId, IsNumber, Max, Min } from 'class-validator'

@ObjectType()
@Entity({ name: 'questionRatingMarks' })
export default class QuestionRatingMark extends Base {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public questionId: ObjectId

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int)
  public mark: number
}