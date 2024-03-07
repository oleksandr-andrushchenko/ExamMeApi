export default class QuestionOwnershipError extends Error {

  constructor(id: string) {
    super(`Question with id="${ id }" ownership error`)
  }
}