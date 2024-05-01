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
  Post,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Exam from '../entities/Exam'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import User from '../entities/User'
import CreateExamSchema from '../schema/exam/CreateExamSchema'
import ExamService from '../services/exam/ExamService'
import PaginatedExams from '../schema/exam/PaginatedExams'
import GetExamSchema from '../schema/exam/GetExamSchema'
import ExamQuestion from '../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswerSchema from '../schema/exam/CreateExamQuestionAnswerSchema'
import GetExamQuestionSchema from '../schema/exam/GetExamQuestionSchema'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import ExamQuerySchema from '../schema/exam/ExamQuerySchema'

@Service()
@JsonController('/exams')
export default class ExamController {

  public constructor(
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
    @Body({ type: CreateExamSchema, required: true }) createExam: CreateExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Exam> {
    return await this.examService.createExam(createExam, user)
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
    @QueryParams({ type: ExamQuerySchema }) examQuery: ExamQuerySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<PaginatedExams> {
    return await this.examService.queryExams(examQuery, user, true) as PaginatedExams
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
    @Params({ type: GetExamSchema, required: true }) getExam: GetExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examService.getExam(getExam.examId, user)
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
  @ResponseSchema(ExamQuestion)
  public async getExamQuestion(
    @Params({ type: GetExamQuestionSchema, required: true }) getExamQuestion: GetExamQuestionSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<ExamQuestion> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    const examQuestion = await this.examService.getExamQuestion(exam, getExamQuestion.question, user)
    await this.examService.setExamLastRequestedQuestionNumber(exam, getExamQuestion.question, user)

    return examQuestion
  }

  @Post('/:examId/questions/:question/answer')
  @Authorized()
  @HttpCode(201)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
    },
  })
  @ResponseSchema(ExamQuestion)
  public async createExamQuestionAnswer(
    @Params({ type: GetExamQuestionSchema, required: true }) getExamQuestion: GetExamQuestionSchema,
    @Body({
      type: CreateExamQuestionAnswerSchema,
      required: true,
    }) createExamQuestionAnswer: CreateExamQuestionAnswerSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<ExamQuestion> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.createExamQuestionAnswer(exam, getExamQuestion.question, createExamQuestionAnswer, user)

    return await this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Post('/:examId/completion')
  @Authorized()
  @HttpCode(201)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
    },
  })
  @ResponseSchema(ExamQuestion)
  public async createExamCompletion(
    @Params({ type: GetExamSchema, required: true }) getExam: GetExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    await this.examService.createExamCompletion(exam, user)

    return exam
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
    @Params({ type: GetExamSchema, required: true }) getExam: GetExamSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    await this.examService.deleteExam(exam, user)
  }
}