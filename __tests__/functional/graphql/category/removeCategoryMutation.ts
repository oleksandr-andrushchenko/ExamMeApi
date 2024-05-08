import GetCategorySchema from '../../../../src/schema/category/GetCategorySchema'

export const removeCategoryMutation = (variables: GetCategorySchema) => {
  return {
    query: `
      mutation RemoveCategory($categoryId: ID!) {
        removeCategory(categoryId: $categoryId)
      }
  `,
    variables,
  }
}