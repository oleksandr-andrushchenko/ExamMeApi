import {
    JsonController,
    Post,
    Body,
    HttpCode,
    CurrentUser,
    Authorized,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import User from "../entity/User";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import UserService from "../service/user/UserService";
import UserSchema from "../schema/user/UserSchema";
import UserEmailTakenError from "../error/user/UserEmailTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";

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
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: 'Created' },
            401: { description: 'Unauthorized' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(User)
    public async create(
        @CurrentUser() currentUser: User,
        @Body({ required: true }) user: UserSchema,
    ): Promise<User> {
        try {
            return await this.userService.createUser(user, currentUser);
        } catch (error: any) {
            switch (true) {
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError(error.message);
            }
        }
    }
}