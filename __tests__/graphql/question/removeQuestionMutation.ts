import GetQuestionSchema from '../../../src/schema/question/GetQuestionSchema'

export const removeQuestionMutation = (variables: GetQuestionSchema) => {
  return {
    query: `
      mutation RemoveQuestion($questionId: ID!) {
        removeQuestion(questionId: $questionId)
      }
  `,
    variables,
  }
}