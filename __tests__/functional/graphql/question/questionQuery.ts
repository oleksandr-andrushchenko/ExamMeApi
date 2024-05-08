import GetQuestionSchema from '../../../../src/schema/question/GetQuestionSchema'

export const questionQuery = (variables: GetQuestionSchema, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Question($questionId: ID!) {
        question(questionId: $questionId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}