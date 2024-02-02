import {
    JsonController,
    Post,
    Body,
    HttpCode,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import User from "../entity/User";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import UserService from "../service/user/UserService";
import UserEmailTakenError from "../error/user/UserEmailTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import UserMeSchema from "../schema/user/UserMeSchema";

@Service()
@JsonController('/me')
export default class UserController {

    constructor(
        @Inject() private readonly userService: UserService,
    ) {
    }

    @Post()
    @HttpCode(201)
    @OpenAPI({
        responses: {
            201: { description: 'Created' },
            400: { description: 'Bad Request' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(User)
    public async createMe(
        @Body({ required: true }) user: UserMeSchema,
    ): Promise<User> {
        try {
            return await this.userService.createMeUser(user);
        } catch (error) {
            switch (true) {
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError((error as UserEmailTakenError).message);
            }
        }
    }
}