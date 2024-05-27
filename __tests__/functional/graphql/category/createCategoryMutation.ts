import CategorySchema from '../../../../src/schema/category/CategorySchema'

export const createCategoryMutation = (variables: { category: CategorySchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateCategory($category: CategorySchema!) {
        createCategory(category: $category) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}