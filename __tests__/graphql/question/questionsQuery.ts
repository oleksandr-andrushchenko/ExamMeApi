import QuestionQuerySchema from '../../../src/schema/question/QuestionQuerySchema'

export const questionsQuery = (variables: QuestionQuerySchema = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Questions($category: ID, $difficulty: String, $type: String, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String, $price: String, $search: String) {
        questions(category: $category, difficulty: $difficulty, type: $type, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order, price: $price, search: $search) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}