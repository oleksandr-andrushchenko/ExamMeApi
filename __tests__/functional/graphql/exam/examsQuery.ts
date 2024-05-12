import ExamQuerySchema from '../../../../src/schema/exam/ExamQuerySchema'

export const examsQuery = (variables: ExamQuerySchema = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Exams($categoryId: ID, $completion: Boolean, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        exams(categoryId: $categoryId, completion: $completion, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}