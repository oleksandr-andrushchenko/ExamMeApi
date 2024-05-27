import GetExamQuestionSchema from '../../../../src/schema/exam/GetExamQuestionSchema'

export const examQuestionQuery = (
  variables: GetExamQuestionSchema,
  fields: string[] = [ 'number' ],
) => {
  return {
    query: `
      query ExamQuestion($examId: ID!, $question: Int!) {
        examQuestion(examId: $examId, question: $question) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}