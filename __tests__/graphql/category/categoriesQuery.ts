export const categoriesQuery = (fields: string[] = [ 'id' ], variables: object = {}) => {
  return {
    query: `
      query Categories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
        categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}