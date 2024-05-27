import QuestionSchema from '../../../../src/schema/question/QuestionSchema'

export const createQuestionMutation = (variables: { question: QuestionSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateQuestion($question: QuestionSchema!) {
        createQuestion(question: $question) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}