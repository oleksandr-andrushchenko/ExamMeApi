import Category from '../../entities/Category'

export default class CategoryNotApprovedError extends Error {

  public constructor(category: Category) {
    super(`Category "${ category.id.toString() }" is not approved`)
  }
}