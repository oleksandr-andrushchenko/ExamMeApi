import { JsonController, Post, Body, HttpCode, NotFoundError, ForbiddenError } from "routing-controllers";
import { Inject, Service } from "typedi";
import AuthService from "../service/auth/AuthService";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import AuthSchema from "../schema/auth/AuthSchema";
import TokenSchema from "../schema/auth/TokenSchema";
import UserService from "../service/user/UserService";
import User from "../entity/User";
import UserNotFoundError from "../error/user/UserNotFoundError";
import UserWrongCredentialsError from "../error/user/UserWrongCredentialsError";

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
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(TokenSchema)
    public async create(@Body({ required: true }) auth: AuthSchema): Promise<TokenSchema> {
        try {
            const user: User = await this.userService.getUserByAuth(auth);

            return await this.authService.createAuth(user);
        } catch (error: any) {
            switch (true) {
                case error instanceof UserNotFoundError:
                    throw new NotFoundError(error.message);
                case error instanceof UserWrongCredentialsError:
                    throw new ForbiddenError(error.message);
            }
        }
    }
}