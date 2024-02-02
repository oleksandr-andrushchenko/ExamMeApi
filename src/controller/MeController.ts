import {
    JsonController,
    Post,
    Body,
    HttpCode, Get, Authorized, CurrentUser, Put, OnUndefined,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import User from "../entity/User";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import UserEmailTakenError from "../error/user/UserEmailTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import MeSchema from "../schema/user/MeSchema";
import MeService from "../service/user/MeService";
import Category from "../entity/Category";

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
        @Body({ required: true }) me: MeSchema,
    ): Promise<User> {
        try {
            return await this.meService.createMe(me);
        } catch (error) {
            switch (true) {
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError((error as UserEmailTakenError).message);
            }
        }
    }

    @Get()
    @Authorized()
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
            401: { description: 'Unauthorized' },
        },
    })
    @ResponseSchema(User)
    public async findMe(
        @CurrentUser({ required: true }) user: User,
    ): Promise<User> {
        return user;
    }

    @Put()
    @Authorized()
    @HttpCode(205)
    @OnUndefined(205)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
        responses: {
            205: { description: 'Reset Content' },
            400: { description: 'Bad Request' },
            401: { description: 'Unauthorized' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(Category)
    public async replaceMe(
        @CurrentUser({ required: true }) user: User,
        @Body({ required: true }) me: MeSchema,
    ): Promise<void> {
        try {
            await this.meService.replaceMe(me, user);
        } catch (error) {
            switch (true) {
                case error instanceof UserEmailTakenError:
                    throw new ConflictHttpError((error as UserEmailTakenError).message);
            }
        }
    }
}