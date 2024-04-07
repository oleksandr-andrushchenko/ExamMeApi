import { IsMongoId, IsNumber, Min } from 'class-validator'

export default class GetExamQuestionSchema {

  @IsMongoId()
  public readonly examId: string

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  public readonly question: number
}