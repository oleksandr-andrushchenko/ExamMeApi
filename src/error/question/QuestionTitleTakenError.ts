export default class QuestionTitleTakenError extends Error {

  constructor(title: string) {
    super(`Title "${ title }" is already taken`)
  }
}