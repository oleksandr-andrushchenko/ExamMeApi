import QuestionSchema from '../../../src/schema/question/QuestionSchema'

export const addQuestionMutation = (variables: { question: QuestionSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddQuestion($question: QuestionSchema!) {
        addQuestion(question: $question) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}