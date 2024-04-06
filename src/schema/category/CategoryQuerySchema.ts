import PaginationSchema from '../pagination/PaginationSchema'
import { IsIn, IsOptional, IsString } from 'class-validator'

export default class CategoryQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsIn([ 'free', 'subscription' ])
  public readonly price: string

  @IsOptional()
  @IsString()
  public readonly search: string
}