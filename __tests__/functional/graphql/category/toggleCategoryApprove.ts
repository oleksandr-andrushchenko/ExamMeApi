import GetCategory from '../../../../src/schema/category/GetCategory'
import Category from '../../../../src/entities/Category'

export const toggleCategoryApprove = (variables: GetCategory, fields: (keyof Category)[] = [ 'id' ]) => {
  return {
    query: `
      mutation ToggleCategoryApprove($categoryId: ID!) {
        toggleCategoryApprove(categoryId: $categoryId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}