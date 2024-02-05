import {
    JsonController, Post, Body, HttpCode, CurrentUser, ForbiddenError, Authorized, Param, NotFoundError,
    BadRequestError, Get, Put, OnUndefined,
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
import QuestionRepository from "../repository/QuestionRepository";
import CategoryService from "../service/category/CategoryService";
import QuestionNotFoundError from "../error/question/QuestionNotFoundError";
import CategoryOwnershipError from "../error/category/CategoryOwnershipError";

@Service()
@JsonController()
export default class QuestionController {

    constructor(
        @Inject() private readonly questionService: QuestionService,
        @Inject() private readonly categoryService: CategoryService,
        @Inject() private readonly questionRepository: QuestionRepository,
    ) {
    }

    @Post('/questions')
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
    @ResponseSchema(Question)
    public async createQuestion(
        @Body({ required: true }) question: QuestionSchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<Question> {
        try {
            return await this.questionService.createQuestion(question, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof CategoryNotFoundError:
                    throw new BadRequestError((error as CategoryNotFoundError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof QuestionTitleTakenError:
                    throw new ConflictHttpError((error as QuestionTitleTakenError).message);
            }
        }
    }

    @Get('/categories/:category_id/questions')
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Question, { isArray: true })
    public async queryCategoryQuestions(
        @Param('category_id') categoryId: string,
    ): Promise<Question[]> {
        try {
            const category = await this.categoryService.getCategory(categoryId);

            return this.questionRepository.findByCategory(category);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
            }
        }
    }

    @Get('/questions/:question_id')
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Question)
    public async findQuestion(
        @Param('question_id') questionId: string,
    ): Promise<Question> {
        try {
            return await this.questionService.getQuestion(questionId);
        } catch (error) {
            switch (true) {
                case error instanceof QuestionNotFoundError:
                    throw new NotFoundError((error as QuestionNotFoundError).message);
            }
        }
    }

    @Put('/questions/:question_id')
    @Authorized()
    @HttpCode(205)
    @OnUndefined(205)
    @OpenAPI({
        security: [ { bearerAuth: [] } ],
        responses: {
            205: { description: 'Reset Content' },
            400: { description: 'Bad Request' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(Question)
    public async replaceQuestion(
        @Param('question_id') questionId: string,
        @Body({ required: true }) question: QuestionSchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<void> {
        try {
            await this.questionService.replaceQuestion(questionId, question, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof CategoryNotFoundError:
                    throw new BadRequestError((error as CategoryNotFoundError).message);
                case error instanceof QuestionNotFoundError:
                    throw new NotFoundError((error as QuestionNotFoundError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
                case error instanceof QuestionTitleTakenError:
                    throw new ConflictHttpError((error as QuestionTitleTakenError).message);
            }
        }
    }
}