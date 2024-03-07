import { IsOptional, Length } from 'class-validator'

export default class CategoryUpdateSchema {

  @IsOptional()
  @Length(3, 30)
  public readonly name: string
}