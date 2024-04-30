export const removeCategoryMutation = (variables: Partial<{
  categoryId: string,
}> = {}) => {
  return {
    query: `
      mutation RemoveCategory($categoryId: ID!) {
        removeCategory(categoryId: $categoryId)
      }
  `,
    variables,
  }
}