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
  Param,
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
import QuestionOwnershipError from '../error/question/QuestionOwnershipError'
import QuestionUpdateSchema from '../schema/question/QuestionUpdateSchema'
import PaginationSchema from '../schema/pagination/PaginationSchema'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'

@Service()
@JsonController()
export default class QuestionController {

  constructor(
    @Inject() private readonly questionService: QuestionService,
    @Inject() private readonly categoryService: CategoryService,
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
      return await this.questionService.createQuestion(question, user)
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
    @QueryParams() pagination: PaginationSchema,
  ): Promise<PaginatedQuestions> {
    try {
      return this.questionService.queryQuestions(pagination)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
      }
    }
  }

  @Get('/categories/:category_id/questions')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(PaginatedQuestions)
  public async queryCategoryQuestions(
    @Param('category_id') categoryId: string,
    @QueryParams() pagination: PaginationSchema,
  ): Promise<PaginatedQuestions> {
    try {
      const category = await this.categoryService.getCategory(categoryId)

      return this.questionService.queryCategoryQuestions(category, pagination)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
      }
    }
  }

  @Get('/questions/:question_id')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(Question)
  public async getQuestion(
    @Param('question_id') id: string,
  ): Promise<Question> {
    try {
      return await this.questionService.getQuestion(id)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
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
  public async replaceQuestion(
    @Param('question_id') id: string,
    @Body({ required: true }) question: QuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.questionService.replaceQuestion(id, question, user)
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
        case error instanceof QuestionOwnershipError:
          throw new ForbiddenError((error as QuestionOwnershipError).message)
        case error instanceof QuestionTitleTakenError:
          throw new ConflictHttpError((error as QuestionTitleTakenError).message)
      }
    }
  }

  @Patch('/questions/:question_id')
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
    @Param('question_id') id: string,
    @Body({ required: true }) question: QuestionUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.questionService.updateQuestion(id, question, user)
    } catch (error) {
      switch (true) {
        case error instanceof CategoryNotFoundError:
          throw new BadRequestError((error as CategoryNotFoundError).message)
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionOwnershipError:
          throw new ForbiddenError((error as QuestionOwnershipError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
        case error instanceof QuestionTitleTakenError:
          throw new ConflictHttpError((error as QuestionTitleTakenError).message)
      }
    }
  }

  @Delete('/questions/:question_id')
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
    @Param('question_id') id: string,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.questionService.deleteQuestion(id, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionOwnershipError:
          throw new ForbiddenError((error as QuestionOwnershipError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
      }
    }
  }
}