import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryService from '../category/CategoryService'
import Cursor from '../../models/Cursor'
import ExamRepository from '../../repositories/ExamRepository'
import CreateExam from '../../schema/exam/CreateExam'
import Exam from '../../entities/Exam'
import ExamTakenError from '../../errors/exam/ExamTakenError'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import ExamQuestionSchema from '../../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswer from '../../schema/exam/CreateExamQuestionAnswer'
import QuestionService from '../question/QuestionService'
import Question from '../../entities/Question'
import { ObjectId } from 'mongodb'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import GetExams from '../../schema/exam/GetExams'
import ExamQuestionNumberNotFoundError from '../../errors/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import PaginatedExams from '../../schema/exam/PaginatedExams'
import QuestionType from '../../entities/question/QuestionType'
import ExamQuestion from '../../entities/exam/ExamQuestion'

@Service()
export default class ExamService {

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryService: CategoryService,
    @Inject() private readonly questionService: QuestionService,
    @Inject() private readonly examRepository: ExamRepository,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authService: AuthService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }


  /**
   * @param {CreateExam} createExam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNotFoundError}
   * @throws {ExamTakenError}
   */
  public async createExam(createExam: CreateExam, initiator: User): Promise<Exam> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.Create)

    await this.validator.validate(createExam)
    const category = await this.categoryService.getCategory(createExam.categoryId)

    await this.verifyExamNotTaken(category, initiator)

    const questions = (await this.questionService.getCategoryQuestions(category) as Question[])
      .map((question: Question): ExamQuestion => {
        const examQuestion = new ExamQuestion()
        examQuestion.questionId = question.id

        return examQuestion
      })

    const exam = new Exam()
    exam.categoryId = category.id
    exam.questions = questions
    exam.creatorId = initiator.id
    exam.ownerId = initiator.id
    exam.createdAt = new Date()

    await this.entityManager.save<Exam>(exam)

    this.eventDispatcher.dispatch('examCreated', { exam })

    return exam
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<ExamQuestionSchema>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ExamQuestionNumberNotFoundError}
   */
  public async getExamQuestion(exam: Exam, questionNumber: number, initiator: User): Promise<ExamQuestionSchema> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.GetQuestion, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    const question = await this.questionService.getQuestion(questions[questionNumber].questionId)

    const examQuestion = new ExamQuestionSchema()
    examQuestion.exam = exam
    examQuestion.question = question
    examQuestion.number = questionNumber

    if (question.type === QuestionType.CHOICE) {
      examQuestion.choice = questions[questionNumber].choice
      examQuestion.choices = question.choices.map(choice => choice.title)
    }

    return examQuestion
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {ExamQuestionNumberNotFoundError}
   */
  public async setExamLastRequestedQuestionNumber(exam: Exam, questionNumber: number, initiator: User): Promise<Exam> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.GetQuestion, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    if (exam.ownerId.toString() !== initiator.id.toString()) {
      return exam
    }

    exam.questionNumber = questionNumber
    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)

    return exam
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {CreateExamQuestionAnswer} createExamQuestionAnswer
   * @param {User} initiator
   * @returns {Promise<ExamQuestion>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async createExamQuestionAnswer(
    exam: Exam,
    questionNumber: number,
    createExamQuestionAnswer: CreateExamQuestionAnswer,
    initiator: User,
  ): Promise<ExamQuestion> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.CreateQuestionAnswer, exam)
    await this.validator.validate(createExamQuestionAnswer)

    const questions = exam.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionService.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      questions[questionNumber].choice = createExamQuestionAnswer.choice
    }

    // todo: optimize
    exam.questions = questions
    exam.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<Exam>(exam)

    return questions[questionNumber]
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async deleteExamQuestionAnswer(
    exam: Exam,
    questionNumber: number,
    initiator: User,
  ): Promise<void> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.deleteQuestionAnswer, exam)

    const questions = exam.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionService.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      delete questions[questionNumber].choice
    }

    // todo: optimize
    exam.questions = questions
    exam.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<Exam>(exam)
  }

  /**
   * @param {GetExams} getExams
   * @param {User} initiator
   * @param {boolean} meta
   * @returns {Promise<Exam[] | PaginatedExams>}
   * @throws {ValidatorError}
   */
  public async getExams(
    getExams: GetExams,
    initiator: User,
    meta: boolean = false,
  ): Promise<Exam[] | PaginatedExams> {
    await this.validator.validate(getExams)

    const cursor = new Cursor<Exam>(getExams, this.examRepository)
    const where = {}

    try {
      await this.authService.verifyAuthorization(initiator, ExamPermission.Get)
    } catch (error) {
      if (error instanceof AuthorizationFailedError) {
        where['ownerId'] = initiator.id
      } else {
        throw error
      }
    }

    if ('categoryId' in getExams) {
      where['categoryId'] = new ObjectId(getExams.categoryId)
    }

    if ('completion' in getExams) {
      where['completedAt'] = { $exists: getExams.completion }
    }

    return await cursor.getPaginated({ where, meta })
  }

  /**
   * @param {ObjectId | string} id
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async getExam(id: ObjectId | string, initiator: User): Promise<Exam> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const exam = await this.examRepository.findOneById(id)

    if (!exam) {
      throw new ExamNotFoundError(id)
    }

    await this.authService.verifyAuthorization(initiator, ExamPermission.Get, exam)

    if ('correctAnswerCount' in exam && !exam.completedAt) {
      delete exam.correctAnswerCount
    }

    return exam
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamCompletion(exam: Exam, initiator: User): Promise<void> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.CreateCompletion, exam)

    const category = await this.categoryService.getCategory(exam.categoryId)
    const questions = await this.questionService.getCategoryQuestions(category) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.id.toString()] = question
    }

    let correctAnswerCount = 0

    for (const examQuestion of exam.questions) {
      const question = questionsHashedById[examQuestion.questionId.toString()]

      if (typeof examQuestion.choice !== 'undefined') {
        if (this.questionService.checkChoice(examQuestion.choice, question)) {
          correctAnswerCount++
        }
      }
    }

    exam.correctAnswerCount = correctAnswerCount
    exam.completedAt = new Date()
    exam.updatedAt = new Date()

    this.eventDispatcher.dispatch('examCompleted', { exam })

    await this.entityManager.save<Exam>(exam)
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteExam(exam: Exam, initiator: User): Promise<Exam> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.Delete, exam)

    exam.deletedAt = new Date()

    await this.entityManager.save<Exam>(exam)

    this.eventDispatcher.dispatch('examDeleted', { exam })

    return exam
  }

  /**
   * @param {Category} category
   * @param {User} user
   * @returns {Promise<void>}
   * @throws {ExamTakenError}
   */
  public async verifyExamNotTaken(category: Category, user: User): Promise<void> {
    const existing = await this.examRepository.findOneNotCompletedByCategoryAndCreator(category.id, user.id)

    if (existing) {
      throw new ExamTakenError(existing)
    }
  }
}