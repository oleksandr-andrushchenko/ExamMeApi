import { IsMongoId, IsNumber, Min } from 'class-validator'

export default class GetExamQuestionSchema {

  @IsMongoId()
  public readonly examId: string

  @IsNumber()
  @Min(0)
  public readonly question: number
}