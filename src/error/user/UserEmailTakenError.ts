export default class UserEmailTakenError extends Error {

  constructor(email: string) {
    super(`Email "${ email }" is already taken`)
  }
}