import { Inject, Service } from 'typedi'
import Exam from '../entities/Exam'
import User from '../entities/User'
import CreateExamSchema from '../schema/exam/CreateExamSchema'
import ExamService from '../services/exam/ExamService'
import GetExamSchema from '../schema/exam/GetExamSchema'
import ExamQuestionSchema from '../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswerSchema from '../schema/exam/CreateExamQuestionAnswerSchema'
import GetExamQuestionSchema from '../schema/exam/GetExamQuestionSchema'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import ExamQuerySchema from '../schema/exam/ExamQuerySchema'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import PaginatedExams from '../schema/exam/PaginatedExams'
import Category from '../entities/Category'
import CategoryService from '../services/category/CategoryService'

@Service()
@Resolver(Exam)
export class ExamResolver {

  public constructor(
    @Inject() private readonly examService: ExamService,
    @Inject() private readonly categoryService: CategoryService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async createExam(
    @Arg('exam') exam: CreateExamSchema,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    return await this.examService.createExam(exam, user)
  }

  @Authorized()
  @Query(_returns => [ Exam ], { name: 'exams' })
  public async getExams(
    @Args() examQuery: ExamQuerySchema,
    @Ctx('user') user: User,
  ): Promise<Exam[]> {
    return await this.examService.queryExams(examQuery, user) as Exam[]
  }

  @Query(_returns => PaginatedExams, { name: 'paginatedExams' })
  public async getPaginatedExams(
    @Args() examQuery: ExamQuerySchema,
    @Ctx('user') user: User,
  ): Promise<PaginatedExams> {
    return await this.examService.queryExams(examQuery, user, true) as PaginatedExams
  }

  @Authorized()
  @Query(_returns => Exam, { name: 'exam' })
  public async getExam(
    @Args() getExam: GetExamSchema,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examService.getExam(getExam.examId, user)
  }

  @Authorized()
  @Query(_returns => ExamQuestionSchema, { name: 'examQuestion' })
  public async getExamQuestion(
    @Args() getExamQuestion: GetExamQuestionSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    const examQuestion = await this.examService.getExamQuestion(exam, getExamQuestion.question, user)
    await this.examService.setExamLastRequestedQuestionNumber(exam, getExamQuestion.question, user)

    return examQuestion
  }

  @Authorized()
  @Query(_returns => ExamQuestionSchema, { name: 'currentExamQuestion' })
  public async getCurrentExamQuestion(
    @Args() getExam: GetExamSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    return await this.examService.getExamQuestion(exam, exam.questionNumber, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async answerExamQuestion(
    @Args() getExamQuestion: GetExamQuestionSchema,
    @Arg('examQuestionAnswer') examQuestionAnswer: CreateExamQuestionAnswerSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.createExamQuestionAnswer(exam, getExamQuestion.question, examQuestionAnswer, user)

    return this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async clearExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestionSchema,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.deleteExamQuestionAnswer(exam, getExamQuestion.question, user)

    return this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async completeExam(
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

  @FieldResolver(_returns => Category, { name: 'category' })
  public async getExamCategory(
    @Root() exam: Exam,
  ): Promise<Category> {
    return await this.categoryService.getCategory(exam.categoryId)
  }
}