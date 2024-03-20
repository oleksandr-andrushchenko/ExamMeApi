import { ObjectId } from 'mongodb'
import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsIn, IsMongoId, IsOptional, IsUrl, ValidateNested } from 'class-validator'

export class PaginatedMetaSchema {

  @IsOptional()
  @IsUrl()
  public prevUrl: string

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public beforeCursor: ObjectId

  @IsOptional()
  @IsUrl()
  public nextUrl: string

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public afterCursor: ObjectId

  @IsIn([ '_id', 'created', 'updated' ])
  public cursor: string
  public order: any

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public nextCursor: any

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public prevCursor: any

  @IsBoolean()
  public hasNext: boolean

  @IsBoolean()
  public hasPrev: boolean
}

export default class PaginatedSchema<Entity> {

  @ValidateNested({ each: true })
  public data: Entity[]

  @ValidateNested()
  @Type(() => PaginatedMetaSchema)
  public meta: PaginatedMetaSchema
}