import Permission from '../../enum/Permission'

export default class AuthorizationFailedError extends Error {

  public constructor(permission: string) {
    super(`Permission with id="${ permission }" authorization error`)
  }
}