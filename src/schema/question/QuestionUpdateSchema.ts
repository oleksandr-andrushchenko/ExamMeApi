import { ArrayNotEmpty, IsEnum, IsMongoId, IsOptional, Length, ValidateIf, ValidateNested } from 'class-validator'
import { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../../entity/Question'
import { Type } from 'class-transformer'

export default class QuestionUpdateSchema {

  @IsOptional()
  @IsMongoId()
  public readonly category: string

  @IsOptional()
  @IsEnum(QuestionType)
  public readonly type: QuestionType

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  public readonly difficulty: QuestionDifficulty

  @IsOptional()
  @Length(5, 3000)
  public readonly title: string

  @IsOptional()
  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoice)
  public readonly choices: QuestionChoice[]

  @IsOptional()
  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswer)
  public readonly answers: QuestionAnswer[]
}