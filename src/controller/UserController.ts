import {
    JsonController,
    Post,
    Body,
    HttpCode,
    CurrentUser,
    Authorized, ForbiddenError, BadRequestError,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import User from "../entity/User";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import UserService from "../service/user/UserService";
import UserSchema from "../schema/user/UserSchema";
import UserEmailTakenError from "../error/user/UserEmailTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import AuthorizationFailedError from "../error/auth/AuthorizationFailedError";
import ValidatorError from "../error/validator/ValidatorError";

@Service()
@JsonController('/users')
export default class UserController {

    constructor(
        @Inject() private readonly userService: UserService,
    ) {
    }

    @Post()
    @Authorized()
    @HttpCode(201)
    @OpenAPI({
        security: [ { bearerAuth: [] } ],
        responses: {
            201: { description: 'Created' },
            400: { description: 'Bad Request' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(User)
    public async createUser(
        @CurrentUser({ required: true }) currentUser: User,
        @Body({ required: true }) user: UserSchema,
    ): Promise<User> {
        try {
            return await this.userService.createUser(user, currentUser);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError((error as UserEmailTakenError).message);
            }
        }
    }
}