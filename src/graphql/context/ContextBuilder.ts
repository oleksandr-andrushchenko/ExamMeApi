import { Inject, Service } from 'typedi'
import AuthService from '../../service/auth/AuthService'
import Context from './Context'
import UserService from '../../service/user/UserService'

@Service()
export default class ContextBuilder {

  public constructor(
    @Inject() private readonly authService: AuthService,
    @Inject() private readonly userService: UserService,
  ) {
  }

  public buildContext() {
    return async ({ req, res }) => {
      const context: Context = {
        user: undefined,
      }
      const userId: string | null = await this.authService.verifyAccessToken(req)

      if (userId) {
          context.user = await this.userService.getUser(userId)
      }

      return context
    }
  }
}