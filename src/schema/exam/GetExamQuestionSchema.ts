import { IsMongoId, IsNumber, Min } from 'class-validator'
import { ArgsType, Field, ID, Int } from 'type-graphql'

@ArgsType()
export default class GetExamQuestionSchema {

  @IsMongoId()
  @Field(_type => ID)
  public readonly examId: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int)
  public readonly question: number
}