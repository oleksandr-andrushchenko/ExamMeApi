export const updateCategoryMutation = (fields: string[] = [ 'id' ], variables: Partial<{
  categoryId: string,
  categoryUpdate: object,
}> = {}) => {
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