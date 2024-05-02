import { Inject, Service } from 'typedi'
import { Arg, Mutation, Resolver } from 'type-graphql'
import UserService from '../services/user/UserService'
import AuthService from '../services/auth/AuthService'
import { CredentialsSchema } from '../schema/auth/CredentialsSchema'
import TokenSchema from '../schema/auth/TokenSchema'

@Service()
@Resolver()
export class AuthResolver {

  public constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly authService: AuthService,
  ) {
  }

  @Mutation(_returns => TokenSchema)
  public async authenticate(@Arg('credentials') credentials: CredentialsSchema): Promise<TokenSchema> {
    const user = await this.userService.getUserByCredentials(credentials)

    return await this.authService.createAuth(user)
  }
}