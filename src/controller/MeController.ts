import {
    JsonController,
    Post,
    Body,
    HttpCode,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import User from "../entity/User";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import UserEmailTakenError from "../error/user/UserEmailTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import MeSchema from "../schema/user/MeSchema";
import MeService from "../service/user/MeService";

@Service()
@JsonController('/me')
export default class UserController {

    constructor(
        @Inject() private readonly meService: MeService,
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
        @Body({ required: true }) user: MeSchema,
    ): Promise<User> {
        try {
            return await this.meService.createMe(user);
        } catch (error) {
            switch (true) {
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError((error as UserEmailTakenError).message);
            }
        }
    }
}