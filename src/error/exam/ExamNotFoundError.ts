export default class ExamNotFoundError extends Error {

  constructor(id: string) {
    super(`Exam with id="${ id }" not found error`)
  }
}