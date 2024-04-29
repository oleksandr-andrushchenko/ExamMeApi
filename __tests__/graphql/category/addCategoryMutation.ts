export const addCategoryMutation = (fields: string[] = [ 'id' ], variables: {
  category: object
} = { category: {} }) => {
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