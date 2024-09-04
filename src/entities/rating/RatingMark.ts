import { Field, Int, ObjectType } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'

@ObjectType()
@Entity({ name: 'ratingMarks' })
export default class RatingMark extends Base {

  @Column()
  @Field(_type => ObjectIdScalar, { nullable: true })
  public categoryId?: ObjectId

  @Column()
  @Field(_type => ObjectIdScalar, { nullable: true })
  public questionId?: ObjectId

  @Column()
  @Field(_type => Int)
  public mark: number
}