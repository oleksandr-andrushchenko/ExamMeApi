import { Inject, Service } from 'typedi'
import Exam from '../entities/Exam'
import User from '../entities/User'
import CreateExam from '../schema/exam/CreateExam'
import ExamService from '../services/exam/ExamService'
import GetExam from '../schema/exam/GetExam'
import ExamQuestionSchema from '../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswer from '../schema/exam/CreateExamQuestionAnswer'
import GetExamQuestion from '../schema/exam/GetExamQuestion'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetExams from '../schema/exam/GetExams'
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
    @Arg('createExam') exam: CreateExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    return await this.examService.createExam(exam, user)
  }

  @Authorized()
  @Query(_returns => [ Exam ], { name: 'exams' })
  public async getExams(
    @Args() getExams: GetExams,
    @Ctx('user') user: User,
  ): Promise<Exam[]> {
    return await this.examService.getExams(getExams, user) as Exam[]
  }

  @Query(_returns => PaginatedExams, { name: 'paginatedExams' })
  public async getPaginatedExams(
    @Args() getExams: GetExams,
    @Ctx('user') user: User,
  ): Promise<PaginatedExams> {
    return await this.examService.getExams(getExams, user, true) as PaginatedExams
  }

  @Authorized()
  @Query(_returns => Exam, { name: 'exam' })
  public async getExam(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examService.getExam(getExam.examId, user)
  }

  @Authorized()
  @Query(_returns => ExamQuestionSchema, { name: 'examQuestion' })
  public async getExamQuestion(
    @Args() getExamQuestion: GetExamQuestion,
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
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    return await this.examService.getExamQuestion(exam, exam.questionNumber, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async createExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestion,
    @Arg('createExamQuestionAnswer') createExamQuestionAnswer: CreateExamQuestionAnswer,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.createExamQuestionAnswer(exam, getExamQuestion.question, createExamQuestionAnswer, user)

    return this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async deleteExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestion,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examService.getExam(getExamQuestion.examId, user)

    await this.examService.deleteExamQuestionAnswer(exam, getExamQuestion.question, user)

    return this.examService.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async createExamCompletion(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examService.getExam(getExam.examId, user)

    await this.examService.createExamCompletion(exam, user)

    return exam
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteExam(
    @Args() getExam: GetExam,
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