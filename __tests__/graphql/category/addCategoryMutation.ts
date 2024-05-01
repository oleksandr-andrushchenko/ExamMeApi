import CategorySchema from '../../../src/schema/category/CategorySchema'

export const addCategoryMutation = (variables: { category: CategorySchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddCategory($category: CategorySchema!) {
        addCategory(category: $category) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}