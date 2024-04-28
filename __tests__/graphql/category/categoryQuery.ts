export const categoryQuery = (fields: string[] = [ 'id' ], variables: object = {}) => {
  return {
    query: `
      query Category($categoryId: String!) {
        category(id: $categoryId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}