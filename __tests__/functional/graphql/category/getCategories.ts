import GetCategories from '../../../../src/schema/category/GetCategories'

export const getCategories = (variables: GetCategories = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetCategories($prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
        categories(prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}