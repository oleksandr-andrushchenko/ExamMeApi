import PaginationSchema from '../pagination/PaginationSchema'
import { IsEnum, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator'
import { QuestionDifficulty, QuestionType } from '../../entities/Question'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class QuestionQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  @Field(_type => ID, { nullable: true })
  public categoryId?: string

  @IsOptional()
  @IsIn([ 'free', 'subscription' ])
  @Field({ nullable: true })
  public readonly price?: string

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public readonly search?: string

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  @Field({ nullable: true })
  public readonly difficulty?: QuestionDifficulty

  @IsOptional()
  @IsEnum(QuestionType)
  @Field({ nullable: true })
  public readonly type?: QuestionType
}