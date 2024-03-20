import { IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Max } from 'class-validator'

export default class PaginationSchema {

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(50)
  public readonly size: number = 1

  @IsOptional()
  @IsIn([ 'asc', 'desc' ])
  public readonly order: 'asc' | 'desc' = 'desc'

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly prevCursor: string

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly nextCursor: string

  @IsOptional()
  @IsIn([ '_id', 'created', 'updated' ])
  public readonly cursor: string = '_id'
}