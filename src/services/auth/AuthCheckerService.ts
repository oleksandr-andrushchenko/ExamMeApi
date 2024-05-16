import { Inject, Service } from 'typedi'
import AuthService from './AuthService'
import User from '../../entities/User'
import UserService from '../user/UserService'
import { AuthChecker, AuthenticationError, AuthorizationError } from 'type-graphql'
import Context from '../../context/Context'
import { Request } from 'express'

@Service()
export class AuthCheckerService {

  public constructor(
    @Inject() private readonly authService: AuthService,
    @Inject() private readonly userService: UserService,
  ) {
  }

  public async getApolloContextUser(req: Request): Promise<User | undefined> {
    const userId: string | null = await this.authService.verifyAccessToken(req)

    if (userId) {
      return await this.userService.getUser(userId)
    }

    return undefined
  }

  public getTypeGraphqlAuthChecker(): AuthChecker<Context> {
    return async ({ context: { user } }, permissions): Promise<boolean> => {
      if (!user) {
        throw new AuthenticationError()
      }

      for (const permission of permissions) {
        if (!await this.authService.verifyAuthorization(user, permission)) {
          throw new AuthorizationError()
        }
      }

      return true
    }
  }
}