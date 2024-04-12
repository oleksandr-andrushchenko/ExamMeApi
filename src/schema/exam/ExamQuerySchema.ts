import PaginationSchema from '../pagination/PaginationSchema'
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator'

export default class ExamQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsMongoId()
  public readonly category: string

  @IsOptional()
  @IsBoolean()
  public readonly completion: boolean
}