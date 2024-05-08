import GetExamSchema from '../../../../src/schema/exam/GetExamSchema'

export const removeExamMutation = (variables: GetExamSchema) => {
  return {
    query: `
      mutation RemoveExam($examId: ID!) {
        removeExam(examId: $examId)
      }
  `,
    variables,
  }
}