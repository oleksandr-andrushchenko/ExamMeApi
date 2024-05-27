import CreateExamQuestionAnswerSchema from '../../../../src/schema/exam/CreateExamQuestionAnswerSchema'
import GetExamQuestionSchema from '../../../../src/schema/exam/GetExamQuestionSchema'

export const answerExamQuestionMutation = (variables: GetExamQuestionSchema & {
  examQuestionAnswer: CreateExamQuestionAnswerSchema
}, fields: string[] = [ 'number' ]) => {
  return {
    query: `
      mutation AnswerExamQuestion($examId: ID!, $question: Int!, $examQuestionAnswer: CreateExamQuestionAnswerSchema!) {
        answerExamQuestion(examId: $examId, question: $question, examQuestionAnswer: $examQuestionAnswer) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}