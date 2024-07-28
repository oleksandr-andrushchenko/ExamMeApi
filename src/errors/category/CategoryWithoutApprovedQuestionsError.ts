import Category from '../../entities/Category'

export default class CategoryWithoutApprovedQuestionsError extends Error {

  public constructor(category: Category) {
    super(`Category "${ category.id.toString() }" does not have approved questions`)
  }
}