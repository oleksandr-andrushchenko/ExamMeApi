import GetQuestions from '../../../../src/schema/question/GetQuestions'

export const getQuestions = (variables: GetQuestions = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetQuestions($categoryId: ID, $difficulty: String, $type: String, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
        questions(categoryId: $categoryId, difficulty: $difficulty, type: $type, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}