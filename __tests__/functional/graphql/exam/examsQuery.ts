import ExamQuerySchema from '../../../../src/schema/exam/ExamQuerySchema'

export const examsQuery = (variables: ExamQuerySchema = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Exams($category: ID, $completion: Boolean, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        exams(category: $category, completion: $completion, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}