import GetCategorySchema from '../../../../src/schema/category/GetCategorySchema'

export const categoryQuery = (variables: GetCategorySchema, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Category($categoryId: ID!) {
        category(categoryId: $categoryId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}