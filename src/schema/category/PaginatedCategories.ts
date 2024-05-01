import PaginatedSchema from '../pagination/PaginatedSchema'
import Category from '../../entities/Category'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export default class PaginatedCategories extends PaginatedSchema<Category> {

  @ValidateNested({ each: true })
  @Type(() => Category)
  public data: Category[]
}