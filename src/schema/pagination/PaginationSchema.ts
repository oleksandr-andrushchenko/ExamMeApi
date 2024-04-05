import { IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator'

export default class PaginationSchema {

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly prevCursor: string

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly nextCursor: string

  @IsOptional()
  @IsIn([ 'id', 'created', 'updated' ])
  public readonly cursor: string = 'id'

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(50)
  public readonly size: number = 10

  @IsOptional()
  @IsIn([ 'asc', 'desc' ])
  public readonly order: 'asc' | 'desc' = 'desc'
}