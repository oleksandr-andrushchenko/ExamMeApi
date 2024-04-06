import PaginationSchema from '../pagination/PaginationSchema'
import { IsMongoId, IsOptional } from 'class-validator'

export default class ExamQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  public readonly category: string
}