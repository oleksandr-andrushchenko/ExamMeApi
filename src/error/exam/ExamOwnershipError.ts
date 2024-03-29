export default class ExamOwnershipError extends Error {

  constructor(id: string) {
    super(`Exam with id="${ id }" ownership error`)
  }
}