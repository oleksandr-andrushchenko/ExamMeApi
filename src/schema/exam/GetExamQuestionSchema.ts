import { IsMongoId, IsNumber, Min } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'

@ArgsType()
export default class GetExamQuestionSchema {

  @IsMongoId()
  @Field(_type => ObjectIdScalar)
  public readonly examId: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public readonly question: number
}