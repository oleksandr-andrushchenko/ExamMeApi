import { IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'

export default class PaginationSchema {

  @IsOptional()
  @IsNumber()
  @IsPositive()
  public readonly size: number

  @IsOptional()
  @IsIn([ 'asc', 'desc' ])
  public readonly order: 'asc' | 'desc'

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly before: string

  @IsOptional()
  @IsString()
  @IsMongoId()
  public readonly after: string
}