import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  ForbiddenError,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  OnUndefined,
  Params,
  Patch,
  Post,
  Put,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Question from '../entity/Question'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import User from '../entity/User'
import QuestionSchema from '../schema/question/QuestionSchema'
import QuestionTitleTakenError from '../error/question/QuestionTitleTakenError'
import ConflictHttpError from '../error/http/ConflictHttpError'
import AuthorizationFailedError from '../error/auth/AuthorizationFailedError'
import QuestionService from '../service/question/QuestionService'
import CategoryNotFoundError from '../error/category/CategoryNotFoundError'
import ValidatorError from '../error/validator/ValidatorError'
import CategoryService from '../service/category/CategoryService'
import QuestionNotFoundError from '../error/question/QuestionNotFoundError'
import QuestionUpdateSchema from '../schema/question/QuestionUpdateSchema'
import PaginationSchema from '../schema/pagination/PaginationSchema'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'
import ValidatorInterface from '../service/validator/ValidatorInterface'
import GetCategorySchema from '../schema/category/GetCategorySchema'
import GetQuestionSchema from '../schema/question/GetQuestionSchema'

@Service()
@JsonController()
export default class QuestionController {

  constructor(
    @Inject() private readonly questionService: QuestionService,
    @Inject() private readonly categoryService: CategoryService,
    @Inject('validator') private readonly validator: ValidatorInterface,
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
    @Body({ type: QuestionSchema, required: true }) questionSchema: QuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Question> {
    try {
      return await this.questionService.createQuestion(questionSchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof CategoryNotFoundError:
          throw new BadRequestError((error as CategoryNotFoundError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionTitleTakenError:
          throw new ConflictHttpError((error as QuestionTitleTakenError).message)
      }
    }
  }

  @Get('/questions')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(PaginatedQuestions)
  public async queryQuestions(
    @QueryParams({ type: PaginationSchema }) pagination: PaginationSchema,
  ): Promise<PaginatedQuestions> {
    try {
      return await this.questionService.queryQuestions(pagination, true) as PaginatedQuestions
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
      }
    }
  }

  @Get('/categories/:categoryId/questions')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(PaginatedQuestions)
  public async queryCategoryQuestions(
    @Params({ type: GetCategorySchema, required: true }) getCategorySchema: GetCategorySchema,
    @QueryParams({ type: PaginationSchema }) pagination: PaginationSchema,
  ): Promise<PaginatedQuestions> {
    try {
      await this.validator.validate(getCategorySchema)

      const category = await this.categoryService.getCategory(getCategorySchema.categoryId)

      return await this.questionService.queryCategoryQuestions(category, pagination, true) as PaginatedQuestions
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
      }
    }
  }

  @Get('/questions/:questionId')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(Question)
  public async getQuestion(
    @Params({ type: GetQuestionSchema, required: true }) getQuestionSchema: GetQuestionSchema,
  ): Promise<Question> {
    try {
      await this.validator.validate(getQuestionSchema)

      return await this.questionService.getQuestion(getQuestionSchema.questionId)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
      }
    }
  }

  @Put('/questions/:questionId')
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
  public async replaceQuestion(
    @Params({ type: GetQuestionSchema, required: true }) getQuestionSchema: GetQuestionSchema,
    @Body({ type: QuestionSchema, required: true }) questionSchema: QuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getQuestionSchema)

      const question = await this.questionService.getQuestion(getQuestionSchema.questionId)

      await this.questionService.replaceQuestion(question, questionSchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNotFoundError:
          throw new BadRequestError((error as CategoryNotFoundError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
        case error instanceof QuestionTitleTakenError:
          throw new ConflictHttpError((error as QuestionTitleTakenError).message)
      }
    }
  }

  @Patch('/questions/:questionId')
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
  public async updateQuestion(
    @Params({ type: GetQuestionSchema, required: true }) getQuestionSchema: GetQuestionSchema,
    @Body({ type: QuestionUpdateSchema, required: true }) questionUpdateSchema: QuestionUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getQuestionSchema)

      const question = await this.questionService.getQuestion(getQuestionSchema.questionId)

      await this.questionService.updateQuestion(question, questionUpdateSchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof CategoryNotFoundError:
          throw new BadRequestError((error as CategoryNotFoundError).message)
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
        case error instanceof QuestionTitleTakenError:
          throw new ConflictHttpError((error as QuestionTitleTakenError).message)
      }
    }
  }

  @Delete('/questions/:questionId')
  @Authorized()
  @HttpCode(204)
  @OnUndefined(204)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      204: { description: 'No Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
    },
  })
  public async deleteQuestion(
    @Params({ type: GetQuestionSchema, required: true }) getQuestionSchema: GetQuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getQuestionSchema)

      const question = await this.questionService.getQuestion(getQuestionSchema.questionId)

      await this.questionService.deleteQuestion(question, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
      }
    }
  }
}