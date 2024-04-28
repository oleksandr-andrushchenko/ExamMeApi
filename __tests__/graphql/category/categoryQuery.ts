export const categoryQuery = (fields: string[] = [ 'id' ], variables: object = {}) => {
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