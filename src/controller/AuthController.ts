import {
  BadRequestError,
  Body,
  ForbiddenError,
  HttpCode,
  JsonController,
  NotFoundError,
  Post,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import AuthService from '../service/auth/AuthService'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import AuthSchema from '../schema/auth/AuthSchema'
import TokenSchema from '../schema/auth/TokenSchema'
import UserService from '../service/user/UserService'
import User from '../entity/User'
import UserNotFoundError from '../error/user/UserNotFoundError'
import UserWrongCredentialsError from '../error/user/UserWrongCredentialsError'
import ValidatorError from '../error/validator/ValidatorError'

@Service()
@JsonController()
export default class AuthController {

  constructor(
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
    @Body({ required: true }) auth: AuthSchema,
  ): Promise<TokenSchema> {
    try {
      const user: User = await this.userService.getUserByAuth(auth)

      return await this.authService.createAuth(user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof UserNotFoundError:
          throw new NotFoundError((error as UserNotFoundError).message)
        case error instanceof UserWrongCredentialsError:
          throw new ForbiddenError((error as UserWrongCredentialsError).message)
      }
    }
  }
}