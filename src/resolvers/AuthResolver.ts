import { Inject, Service } from 'typedi'
import { Arg, Mutation, Resolver } from 'type-graphql'
import UserService from '../services/user/UserService'
import AuthService from '../services/auth/AuthService'
import { Credentials } from '../schema/auth/Credentials'
import Token from '../schema/auth/Token'

@Service()
@Resolver()
export class AuthResolver {

  public constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly authService: AuthService,
  ) {
  }

  @Mutation(_returns => Token)
  public async authenticate(
    @Arg('credentials') credentials: Credentials,
  ): Promise<Token> {
    const user = await this.userService.getUserByCredentials(credentials)

    return await this.authService.createAuth(user)
  }
}