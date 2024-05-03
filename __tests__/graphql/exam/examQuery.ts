import GetExamSchema from '../../../src/schema/exam/GetExamSchema'

export const examQuery = (variables: GetExamSchema, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Exam($examId: ID!) {
        exam(examId: $examId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}