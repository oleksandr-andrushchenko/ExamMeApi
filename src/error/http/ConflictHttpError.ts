import { HttpError } from 'routing-controllers'

export default class ConflictHttpError extends HttpError {

  public constructor(message?: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}