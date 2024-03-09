import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../../entity/Question'
import { Type } from 'class-transformer'

export default class QuestionSchema {

  @IsMongoId()
  public readonly category: string

  @IsEnum(QuestionType)
  public readonly type: QuestionType

  @IsEnum(QuestionDifficulty)
  public readonly difficulty: QuestionDifficulty

  @Length(5, 3000)
  public readonly title: string

  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoice)
  public readonly choices: QuestionChoice[]

  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswer)
  public readonly answers: QuestionAnswer[]
}