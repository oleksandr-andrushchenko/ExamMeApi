import { IsNumber, IsOptional, Length, Min } from 'class-validator'

export default class CreateExamQuestionAnswerSchema {

  @IsOptional()
  @Min(0)
  @IsNumber()
  public readonly choice: number

  @IsOptional()
  @Length(2, 10)
  public readonly answer: string
}