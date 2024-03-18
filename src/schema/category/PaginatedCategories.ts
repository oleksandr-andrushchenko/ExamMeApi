import PaginatedSchema from '../pagination/PaginatedSchema'
import Category from '../../entity/Category'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export default class PaginatedCategories extends PaginatedSchema<Category> {

  @ValidateNested({ each: true })
  @Type(() => Category)
  public data: Category[]
}