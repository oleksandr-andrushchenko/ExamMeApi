import { Type } from 'class-transformer'
import { IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator'

export class PaginatedMetaSchema {

  @IsOptional()
  @IsString()
  public prevCursor: string

  @IsOptional()
  @IsUrl()
  public prevUrl: string

  @IsOptional()
  @IsString()
  public nextCursor: string

  @IsOptional()
  @IsUrl()
  public nextUrl: string

  @IsIn([ 'id', 'created', 'updated' ])
  public cursor: string = 'id'

  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(50)
  public size: number = 10

  @IsIn([ 'asc', 'desc' ])
  public order: 'asc' | 'desc' = 'desc'
}

export default class PaginatedSchema<Entity> {

  @ValidateNested({ each: true })
  public data: Entity[]

  @ValidateNested()
  @Type(() => PaginatedMetaSchema)
  public meta: PaginatedMetaSchema
}