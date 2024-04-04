import { ObjectId } from 'mongodb'

export default class QuestionNotFoundError extends Error {

  constructor(id: ObjectId) {
    super(`Question with id="${ id.toString() }" not found error`)
  }
}