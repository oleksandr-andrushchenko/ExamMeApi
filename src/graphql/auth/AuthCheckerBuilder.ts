import { AuthChecker } from 'type-graphql'
import Context from '../context/Context'
import { Inject, Service } from 'typedi'
import AuthService from '../../service/auth/AuthService'

@Service()
export default class AuthCheckerBuilder {

  public constructor(
    @Inject() private readonly authService: AuthService,
  ) {
  }

  public buildAuthChecker(): AuthChecker<Context> {
    return async ({ context: { user } }, permissions): Promise<boolean> => {
      if (!user) {
        return false
      }

      if (permissions.length === 0) {
        return true
      }

      for (const permission of permissions) {
        if (await this.authService.verifyAuthorization(user, permission)) {
          return true
        }
      }

      return false
    }
  }
}