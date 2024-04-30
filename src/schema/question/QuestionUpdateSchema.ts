import { ArrayNotEmpty, IsEnum, IsMongoId, IsOptional, Length, ValidateIf, ValidateNested } from 'class-validator'
import { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../../entity/Question'
import { Type } from 'class-transformer'
import { Field, ID, InputType } from 'type-graphql'

@InputType()
export default class QuestionUpdateSchema {

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly category?: string

  @IsOptional()
  @IsEnum(QuestionType)
  @Field({ nullable: true })
  public readonly type?: QuestionType

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  @Field({ nullable: true })
  public readonly difficulty?: QuestionDifficulty

  @IsOptional()
  @Length(5, 3000)
  @Field({ nullable: true })
  public readonly title?: string

  @IsOptional()
  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoice)
  @Field({ nullable: true })
  public readonly choices?: QuestionChoice[]

  @IsOptional()
  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswer)
  @Field({ nullable: true })
  public readonly answers?: QuestionAnswer[]
}