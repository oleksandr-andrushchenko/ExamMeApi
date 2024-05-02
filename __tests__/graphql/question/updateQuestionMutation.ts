import GetQuestionSchema from '../../../src/schema/question/GetQuestionSchema'
import QuestionUpdateSchema from '../../../src/schema/question/QuestionUpdateSchema'

export const updateQuestionMutation = (variables: GetQuestionSchema & {
  questionUpdate: QuestionUpdateSchema
}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateQuestion($questionId: ID!, $questionUpdate: QuestionUpdateSchema!) {
        updateQuestion(questionId: $questionId, questionUpdate: $questionUpdate) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}