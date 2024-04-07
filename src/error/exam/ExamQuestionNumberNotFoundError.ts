export default class ExamQuestionNumberNotFoundError extends Error {

  constructor(number: number) {
    super(`Question with number="${ number }" not found error`)
  }
}