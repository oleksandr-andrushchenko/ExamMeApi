export default class QuestionTypeError extends Error {

  constructor(type: string) {
    super(`Type "${ type }" is invalid`)
  }
}