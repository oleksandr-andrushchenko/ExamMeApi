import { ObjectId } from 'mongodb'
import { Transform, Type } from 'class-transformer'
import { IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsUrl, Max, Min, ValidateNested } from 'class-validator'

export class PaginatedMetaSchema {

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public prevCursor: ObjectId

  @IsOptional()
  @IsUrl()
  public prevUrl: string

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public nextCursor: ObjectId

  @IsOptional()
  @IsUrl()
  public nextUrl: string

  @IsIn([ '_id', 'created', 'updated' ])
  public cursor: string

  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(50)
  public size: number = 1

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