import { Inject, Service } from 'typedi'
import Exam from '../entities/Exam'
import User from '../entities/User'
import CreateExamSchema from '../schema/exam/CreateExamSchema'
import ExamService from '../services/exam/ExamService'
import GetExamSchema from '../schema/exam/GetExamSchema'
import ExamQuestion from '../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswerSchema from '../schema/exam/CreateExamQuestionAnswerSchema'
import GetExamQuestionSchema from '../schema/exam/GetExamQuestionSchema'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import ExamQuerySchema from '../schema/exam/ExamQuerySchema'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'

@Service()
@Resolver(Exam)
export class ExamResolver {

  public constructor(
    @Inject() private readonly examService: ExamService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async addExam(
    @Arg('exam') exam: CreateExamSchema,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    return await this.examService.createExam(exam, user)
  }

  @Authorized()
  @Query(_returns => [ Exam ])
  public async exams(
    @Args() examQuery: ExamQuerySchema,
    @Ctx('user') user: User,
  ): Promise<Exam[]> {
    return await this.examService.queryExams(examQuery, user, true) as Exam[]
  }

  @Authorized()
  @Query(_returns => Exam)
  public async exam(
    @Args() getExam: GetExamSchema,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examService.getExam(getExam.examId, user)
  }

  @Authorized()
  @Query(_returns => ExamQuestion)
  public async examQuestion(
    @Args() getExamQuestion: GetExamQuestionSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestion> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    const examQuestion = await this.examService.getExamQuestion(exam, getExamQuestion.question, user)
    await this.examService.setExamLastRequestedQuestionNumber(exam, getExamQuestion.question, user)

    return examQuestion
  }

  @Authorized()
  @Mutation(_returns => ExamQuestion)
  public async addExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestionSchema,
    @Arg('examQuestionAnswer') examQuestionAnswer: CreateExamQuestionAnswerSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestion> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.createExamQuestionAnswer(exam, getExamQuestion.question, examQuestionAnswer, user)

    return await this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async addExamCompletion(
    @Args() getExam: GetExamSchema,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    await this.examService.createExamCompletion(exam, user)

    return exam
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async removeExam(
    @Args() getExam: GetExamSchema,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    await this.examService.deleteExam(exam, user)

    return true
  }
}