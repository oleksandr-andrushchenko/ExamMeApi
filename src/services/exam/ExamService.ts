import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/Category'
import User from '../../entities/User'
import AuthService from '../auth/AuthService'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryService from '../category/CategoryService'
import PaginatedSchema from '../../schema/pagination/PaginatedSchema'
import Cursor from '../../models/Cursor'
import ExamRepository from '../../repositories/ExamRepository'
import CreateExamSchema from '../../schema/exam/CreateExamSchema'
import Exam, { ExamQuestion } from '../../entities/Exam'
import ExamTakenError from '../../errors/exam/ExamTakenError'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import ExamQuestionSchema from '../../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswerSchema from '../../schema/exam/CreateExamQuestionAnswerSchema'
import QuestionService from '../question/QuestionService'
import Question, { QuestionChoice, QuestionType } from '../../entities/Question'
import { ObjectId } from 'mongodb'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import ExamQuerySchema from '../../schema/exam/ExamQuerySchema'
import ExamQuestionNumberNotFoundError from '../../errors/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'

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
   * @param {CreateExamSchema} transfer
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNotFoundError}
   * @throws {ExamTakenError}
   */
  public async createExam(transfer: CreateExamSchema, initiator: User): Promise<Exam> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.CREATE)

    await this.validator.validate(transfer)
    const category = await this.categoryService.getCategory(transfer.category)

    await this.verifyExamNotTaken(category, initiator)

    const questions = (await this.questionService.queryCategoryQuestions(category) as Question[])
      .map((question: Question): ExamQuestion => {
        const examQuestion = new ExamQuestion()
        examQuestion.question = question.id

        return examQuestion
      })

    const exam = new Exam()
    exam.category = category.id
    exam.questions = questions
    exam.creator = initiator.id
    exam.owner = initiator.id
    exam.created = new Date()

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
    await this.authService.verifyAuthorization(initiator, ExamPermission.GET_QUESTION, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    const examQuestion = new ExamQuestionSchema()
    const question = await this.questionService.getQuestion(questions[questionNumber].question)

    examQuestion.number = questionNumber
    examQuestion.question = question.title
    examQuestion.difficulty = question.difficulty
    examQuestion.type = question.type

    if (examQuestion.type === QuestionType.CHOICE) {
      examQuestion.choices = question.choices.map((choice: QuestionChoice) => choice.title)
      examQuestion.choice = questions[questionNumber].choice
    } else if (examQuestion.type === QuestionType.TYPE) {
      examQuestion.answer = questions[questionNumber].answer
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
    await this.authService.verifyAuthorization(initiator, ExamPermission.GET_QUESTION, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    if (exam.owner.toString() !== initiator.id.toString()) {
      return exam
    }

    exam.questionNumber = questionNumber
    exam.updated = new Date()

    await this.entityManager.save<Exam>(exam)

    return exam
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {CreateExamQuestionAnswerSchema} examQuestionAnswer
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async createExamQuestionAnswer(
    exam: Exam,
    questionNumber: number,
    examQuestionAnswer: CreateExamQuestionAnswerSchema,
    initiator: User,
  ): Promise<void> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.CREATE_QUESTION_ANSWER, exam)
    await this.validator.validate(examQuestionAnswer)

    const questions = exam.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionService.getQuestion(questions[questionNumber].question)

    if (question.type === QuestionType.CHOICE) {
      questions[questionNumber].choice = examQuestionAnswer.choice
    } else if (question.type === QuestionType.TYPE) {
      questions[questionNumber].answer = examQuestionAnswer.answer
    }

    // todo: optimize
    exam.questions = questions
    exam.updated = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<Exam>(exam)
  }

  /**
   * @param {ExamQuerySchema} query
   * @param {User} initiator
   * @param {boolean} meta
   * @returns {Promise<Exam[] | PaginatedSchema<Exam>>}
   * @throws {ValidatorError}
   */
  public async queryExams(
    query: ExamQuerySchema,
    initiator: User,
    meta: boolean = false,
  ): Promise<Exam[] | PaginatedSchema<Exam>> {
    await this.validator.validate(query)

    const cursor = new Cursor<Exam>(query, this.examRepository)
    const where = {}

    try {
      await this.authService.verifyAuthorization(initiator, ExamPermission.GET)
    } catch (error) {
      if (error instanceof AuthorizationFailedError) {
        where['owner'] = initiator.id
      } else {
        throw error
      }
    }

    if ('category' in query) {
      where['category'] = new ObjectId(query.category)
    }

    if ('completion' in query) {
      where['completed'] = { $exists: query.completion }
    }

    return await cursor.getPaginated(where, meta)
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

    await this.authService.verifyAuthorization(initiator, ExamPermission.GET, exam)

    return exam
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamCompletion(exam: Exam, initiator: User): Promise<void> {
    await this.authService.verifyAuthorization(initiator, ExamPermission.CREATE_COMPLETION, exam)

    const category = await this.categoryService.getCategory(exam.category)
    const questions = await this.questionService.queryCategoryQuestions(category) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.id.toString()] = question
    }

    let correctAnswers = 0

    for (const examQuestion of exam.questions) {
      const question = questionsHashedById[examQuestion.question.toString()]

      if (typeof examQuestion.choice !== 'undefined') {
        if (this.questionService.checkChoice(examQuestion.choice, question)) {
          correctAnswers++
        }
      } else if (typeof examQuestion.answer !== 'undefined') {
        if (this.questionService.checkAnswer(examQuestion.answer, question)) {
          correctAnswers++
        }
      }
    }

    exam.correctCount = correctAnswers
    exam.completed = new Date()
    exam.updated = new Date()

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
    await this.authService.verifyAuthorization(initiator, ExamPermission.DELETE, exam)

    exam.deleted = new Date()

    await this.entityManager.remove<Exam>(exam)

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