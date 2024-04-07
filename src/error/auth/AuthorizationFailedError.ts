import Permission from '../../enum/Permission'

export default class AuthorizationFailedError extends Error {

  constructor(permission: Permission) {
    super(`Permission with id="${ permission }" authorization error`)
  }
}