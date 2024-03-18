import { ObjectId } from 'mongodb'
import { Transform, Type } from 'class-transformer'
import { IsMongoId, IsOptional, IsUrl, ValidateNested } from 'class-validator'

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
}

export default class PaginatedSchema<Entity> {

  @ValidateNested({ each: true })
  public data: Entity[]

  @ValidateNested()
  @Type(() => PaginatedMetaSchema)
  public meta: PaginatedMetaSchema
}