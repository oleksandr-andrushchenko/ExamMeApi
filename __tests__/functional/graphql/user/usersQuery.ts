import UserQuerySchema from '../../../../src/schema/user/UserQuerySchema'

export const usersQuery = (variables: UserQuerySchema = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Users($search: String, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        users(search: $search, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}