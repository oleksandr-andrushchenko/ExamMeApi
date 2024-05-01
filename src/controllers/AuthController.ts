import { Body, HttpCode, JsonController, Post } from 'routing-controllers'
import { Inject, Service } from 'typedi'
import AuthService from '../services/auth/AuthService'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import { CredentialsSchema } from '../schema/auth/CredentialsSchema'
import TokenSchema from '../schema/auth/TokenSchema'
import UserService from '../services/user/UserService'
import User from '../entities/User'

@Service()
@JsonController()
export default class AuthController {

  public constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly authService: AuthService,
  ) {
  }

  @Post('/auth')
  @HttpCode(201)
  @OpenAPI({
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(TokenSchema)
  public async createAuth(
    @Body({ type: CredentialsSchema, required: true }) credentials: CredentialsSchema,
  ): Promise<TokenSchema> {
    const user: User = await this.userService.getUserByCredentials(credentials)

    return await this.authService.createAuth(user)
  }
}