export default class UserOwnershipError extends Error {

  constructor(id: string) {
    super(`User with id="${ id }" ownership error`)
  }
}