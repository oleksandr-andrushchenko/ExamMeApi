import { ArrayNotEmpty, IsEnum, IsMongoId, IsOptional, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ID, InputType } from 'type-graphql'
import { QuestionChoiceSchema } from './QuestionChoiceSchema'
import QuestionType from '../../entities/question/QuestionType'
import QuestionDifficulty from '../../entities/question/QuestionDifficulty'

@InputType()
export default class UpdateQuestion {

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public readonly categoryId?: string

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
  @Type(() => QuestionChoiceSchema)
  @Field(_type => [ QuestionChoiceSchema! ], { nullable: true })
  public readonly choices?: QuestionChoiceSchema[]
}