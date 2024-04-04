import { IsMongoId } from 'class-validator'

export default class GetCategorySchema {

  @IsMongoId()
  public readonly categoryId: string
}