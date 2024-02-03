import {
    JsonController, Post, Body, HttpCode, CurrentUser, ForbiddenError, Authorized, Param, NotFoundError,
    BadRequestError,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import Question from "../entity/Question";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import User from "../entity/User";
import QuestionSchema from "../schema/question/QuestionSchema";
import QuestionTitleTakenError from "../error/question/QuestionTitleTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import AuthorizationFailedError from "../error/auth/AuthorizationFailedError";
import QuestionService from "../service/question/QuestionService";
import CategoryNotFoundError from "../error/category/CategoryNotFoundError";
import ValidatorError from "../error/validator/ValidatorError";

@Service()
@JsonController('/categories/:id/questions')
export default class QuestionController {

    constructor(
        @Inject() private readonly questionService: QuestionService,
    ) {
    }

    @Post()
    @Authorized()
    @HttpCode(201)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
        responses: {
            201: { description: 'Created' },
            400: { description: 'Bad Request' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(Question)
    public async createQuestion(
        @Param('id') categoryId: string,
        @Body({ required: true }) question: QuestionSchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<Question> {
        try {
            return await this.questionService.createQuestion(categoryId, question, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof QuestionTitleTakenError:
                    throw new ConflictHttpError((error as QuestionTitleTakenError).message);
            }
        }
    }
}