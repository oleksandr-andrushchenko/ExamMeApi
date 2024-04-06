import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  ForbiddenError,
  HttpCode,
  JsonController,
  Post,
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
import ExamTakenError from '../error/exam/ExamTakenError'

@Service()
@JsonController('/exams')
export default class ExamController {

  constructor(
    @Inject() private readonly examService: ExamService,
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
}