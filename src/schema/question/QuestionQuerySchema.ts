import PaginationSchema from '../pagination/PaginationSchema'
import { IsEnum, IsIn, IsMongoId, IsOptional, IsString } from 'class-validator'
import { QuestionDifficulty, QuestionType } from '../../entity/Question'

export default class QuestionQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  public category: string

  @IsOptional()
  @IsIn([ 'free', 'subscription' ])
  public readonly price: string

  @IsOptional()
  @IsString()
  public readonly search: string

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  public readonly difficulty: QuestionDifficulty

  @IsOptional()
  @IsEnum(QuestionType)
  public readonly type: QuestionType
}