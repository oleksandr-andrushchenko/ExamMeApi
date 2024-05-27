import CreateExamSchema from '../../../../src/schema/exam/CreateExamSchema'

export const createExamMutation = (variables: { exam: CreateExamSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateExam($exam: CreateExamSchema!) {
        createExam(exam: $exam) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}