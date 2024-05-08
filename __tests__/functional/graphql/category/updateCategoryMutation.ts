import CategoryUpdateSchema from '../../../../src/schema/category/CategoryUpdateSchema'
import GetCategorySchema from '../../../../src/schema/category/GetCategorySchema'

export const updateCategoryMutation = (variables: GetCategorySchema & {
  categoryUpdate: CategoryUpdateSchema
}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateCategory($categoryId: ID!, $categoryUpdate: CategoryUpdateSchema!) {
        updateCategory(categoryId: $categoryId, categoryUpdate: $categoryUpdate) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}