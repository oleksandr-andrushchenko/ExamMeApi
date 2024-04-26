import { Inject, Service } from 'typedi'
import AuthService from './AuthService'
import { Action } from 'routing-controllers'
import User from '../../entity/User'
import UserService from '../user/UserService'
import { AuthChecker } from 'type-graphql'
import Context from '../../graphql/context/Context'
import { Request } from 'express'

@Service()
export class AuthCheckerService {

  public constructor(
    @Inject() private readonly authService: AuthService,
    @Inject() private readonly userService: UserService,
  ) {
  }

  public getRoutingControllersAuthorizationChecker(): (action: Action) => Promise<boolean> {
    return async (action: Action): Promise<boolean> => {
      const req = action.request
      const userId: string | null = await this.authService.verifyAccessToken(req)

      req.userId = userId

      return userId !== null
    }
  }

  public getRoutingControllersCurrentUserChecker(): (action: Action) => Promise<User | null> {
    return async (action: Action) => {
      const req = action.request
      const userId: string | null = req.hasOwnProperty('userId') ? req.userId : await this.authService.verifyAccessToken(req)

      if (userId === null) {
        return null
      }

      return await this.userService.getUser(userId)
    }
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
        return false
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