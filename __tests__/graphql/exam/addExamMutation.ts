import CreateExamSchema from '../../../src/schema/exam/CreateExamSchema'

export const addExamMutation = (variables: { exam: CreateExamSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddExam($exam: CreateExamSchema!) {
        addExam(exam: $exam) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}