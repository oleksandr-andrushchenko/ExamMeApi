import CreateExamQuestionAnswerSchema from '../../../../src/schema/exam/CreateExamQuestionAnswerSchema'
import GetExamQuestionSchema from '../../../../src/schema/exam/GetExamQuestionSchema'

export const addExamQuestionAnswerMutation = (variables: GetExamQuestionSchema & {
  examQuestionAnswer: CreateExamQuestionAnswerSchema
}, fields: string[] = [ 'difficulty', 'question', 'difficulty' ]) => {
  return {
    query: `
      mutation AddExamQuestionAnswer($examId: ID!, $question: Int!, $examQuestionAnswer: CreateExamQuestionAnswerSchema!) {
        addExamQuestionAnswer(examId: $examId, question: $question, examQuestionAnswer: $examQuestionAnswer) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}