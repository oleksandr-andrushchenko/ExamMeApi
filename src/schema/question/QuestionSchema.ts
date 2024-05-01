import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from 'class-validator'
import { QuestionDifficulty, QuestionType } from '../../entity/Question'
import { Type } from 'class-transformer'
import { Field, ID, InputType } from 'type-graphql'
import { QuestionChoiceSchema } from './QuestionChoiceSchema'
import { QuestionAnswerSchema } from './QuestionAnswerSchema'

@InputType()
export default class QuestionSchema {

  @IsMongoId()
  @Field(_type => ID)
  public readonly category: string

  @IsEnum(QuestionType)
  @Field()
  public readonly type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Field()
  public readonly difficulty: QuestionDifficulty

  @Length(10, 3000)
  @Field()
  public readonly title: string

  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceSchema)
  @Field(_type => [ QuestionChoiceSchema! ], { nullable: true })
  public readonly choices?: QuestionChoiceSchema[]

  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerSchema)
  @Field(_type => [ QuestionAnswerSchema! ], { nullable: true })
  public readonly answers?: QuestionAnswerSchema[]
}