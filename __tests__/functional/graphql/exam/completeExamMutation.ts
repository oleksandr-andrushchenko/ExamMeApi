import GetExamSchema from '../../../../src/schema/exam/GetExamSchema'

export const completeExamMutation = (variables: GetExamSchema, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CompleteExam($examId: ID!) {
        completeExam(examId: $examId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}