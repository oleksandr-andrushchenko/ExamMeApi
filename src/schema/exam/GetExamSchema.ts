import { IsMongoId } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'

@ArgsType()
export default class GetExamSchema {

  @IsMongoId()
  @Field(_type => ObjectIdScalar)
  public readonly examId: string
}