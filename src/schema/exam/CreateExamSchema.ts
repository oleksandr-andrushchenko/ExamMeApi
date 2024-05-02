import { IsMongoId } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'

@InputType()
export default class CreateExamSchema {

  @IsMongoId()
  @Field(_type => ObjectIdScalar)
  public readonly category: string
}