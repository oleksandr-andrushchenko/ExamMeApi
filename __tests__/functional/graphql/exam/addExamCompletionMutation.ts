import GetExamSchema from '../../../../src/schema/exam/GetExamSchema'

export const addExamCompletionMutation = (variables: GetExamSchema, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddExamCompletion($examId: ID!) {
        addExamCompletion(examId: $examId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}