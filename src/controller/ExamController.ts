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
  Post,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Exam from '../entity/Exam'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import User from '../entity/User'
import CreateExamSchema from '../schema/exam/CreateExamSchema'
import ConflictHttpError from '../error/http/ConflictHttpError'
import AuthorizationFailedError from '../error/auth/AuthorizationFailedError'
import ExamService from '../service/exam/ExamService'
import CategoryNotFoundError from '../error/category/CategoryNotFoundError'
import ValidatorError from '../error/validator/ValidatorError'
import ExamNotFoundError from '../error/exam/ExamNotFoundError'
import PaginatedExams from '../schema/exam/PaginatedExams'
import ExamTakenError from '../error/exam/ExamTakenError'
import GetExamSchema from '../schema/exam/GetExamSchema'
import ExamQuestion from '../schema/exam/ExamQuestionSchema'
import GetExamQuestionSchema from '../schema/exam/GetExamQuestionSchema'
import ValidatorInterface from '../service/validator/ValidatorInterface'
import ExamQuerySchema from '../schema/exam/ExamQuerySchema'
import QuestionNotFoundError from '../error/question/QuestionNotFoundError'
import ExamQuestionNumberNotFoundError from '../error/exam/ExamQuestionNumberNotFoundError'

@Service()
@JsonController('/exams')
export default class ExamController {

  constructor(
    @Inject() private readonly examService: ExamService,
    @Inject('validator') private readonly validator: ValidatorInterface,
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
  @ResponseSchema(Exam)
  public async createExam(
    @Body({ type: CreateExamSchema, required: true }) createExamSchema: CreateExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Exam> {
    try {
      return await this.examService.createExam(createExamSchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof CategoryNotFoundError:
          throw new BadRequestError((error as CategoryNotFoundError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof ExamTakenError:
          throw new ConflictHttpError((error as ExamTakenError).message)
      }
    }
  }

  @Get()
  @Authorized()
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
    },
  })
  @ResponseSchema(PaginatedExams)
  public async queryExams(
    @QueryParams({ type: ExamQuerySchema }) query: ExamQuerySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<PaginatedExams> {
    try {
      return await this.examService.queryExams(query, user, true) as PaginatedExams
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
      }
    }
  }

  @Get('/:examId')
  @Authorized()
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(Exam)
  public async getExam(
    @Params({ type: GetExamSchema, required: true }) getExamSchema: GetExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Exam> {
    try {
      await this.validator.validate(getExamSchema)

      return await this.examService.getExam(getExamSchema.examId, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
      }
    }
  }

  @Get('/:examId/questions/:question')
  @Authorized()
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(Exam)
  public async getExamQuestion(
    @Params({ type: GetExamQuestionSchema, required: true }) getExamQuestionSchema: GetExamQuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<ExamQuestion> {
    try {
      await this.validator.validate(getExamQuestionSchema)
      const exam = await this.examService.getExam(getExamQuestionSchema.examId, user)

      const examQuestion = await this.examService.getExamQuestion(exam, getExamQuestionSchema.question, user)
      await this.examService.setExamLastRequestedQuestionNumber(exam, getExamQuestionSchema.question, user)

      return examQuestion
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof QuestionNotFoundError:
          throw new NotFoundError((error as QuestionNotFoundError).message)
        case error instanceof ExamQuestionNumberNotFoundError:
          throw new NotFoundError((error as ExamQuestionNumberNotFoundError).message)
      }
    }
  }

  @Delete('/:examId')
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
  public async deleteExam(
    @Params({ type: GetExamSchema, required: true }) getExamSchema: GetExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getExamSchema)
      const exam = await this.examService.getExam(getExamSchema.examId, user)

      await this.examService.deleteExam(exam, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof ExamNotFoundError:
          throw new NotFoundError((error as ExamNotFoundError).message)
      }
    }
  }
}