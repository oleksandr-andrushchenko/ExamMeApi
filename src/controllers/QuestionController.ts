import {
  Authorized,
  Body,
  CurrentUser,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Params,
  Patch,
  Post,
  Put,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Question from '../entities/Question'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import User from '../entities/User'
import QuestionSchema from '../schema/question/QuestionSchema'
import QuestionService from '../services/question/QuestionService'
import CategoryService from '../services/category/CategoryService'
import QuestionUpdateSchema from '../schema/question/QuestionUpdateSchema'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetCategorySchema from '../schema/category/GetCategorySchema'
import GetQuestionSchema from '../schema/question/GetQuestionSchema'
import QuestionQuerySchema from '../schema/question/QuestionQuerySchema'

@Service()
@JsonController()
export default class QuestionController {

  public constructor(
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
    @Body({ type: QuestionSchema, required: true }) question: QuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Question> {
    return await this.questionService.createQuestion(question, user)
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
    @QueryParams({ type: QuestionQuerySchema }) questionQuery: QuestionQuerySchema,
  ): Promise<PaginatedQuestions> {
    return await this.questionService.queryQuestions(questionQuery, true) as PaginatedQuestions
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
    @Params({ type: GetCategorySchema, required: true }) getCategory: GetCategorySchema,
    @QueryParams({ type: QuestionQuerySchema }) questionQuery: QuestionQuerySchema,
  ): Promise<PaginatedQuestions> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    return await this.questionService.queryCategoryQuestions(category, questionQuery, true) as PaginatedQuestions
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
    @Params({ type: GetQuestionSchema, required: true }) getQuestion: GetQuestionSchema,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionService.getQuestion(getQuestion.questionId)
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
    @Params({ type: GetQuestionSchema, required: true }) getQuestion: GetQuestionSchema,
    @Body({ type: QuestionSchema, required: true }) questionReplace: QuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    await this.questionService.replaceQuestion(question, questionReplace, user)
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
    @Params({ type: GetQuestionSchema, required: true }) getQuestion: GetQuestionSchema,
    @Body({ type: QuestionUpdateSchema, required: true }) questionUpdate: QuestionUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    await this.questionService.updateQuestion(question, questionUpdate, user)
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
    @Params({ type: GetQuestionSchema, required: true }) getQuestion: GetQuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    await this.questionService.deleteQuestion(question, user)
  }
}