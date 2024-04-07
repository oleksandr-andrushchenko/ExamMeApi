import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorator/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorator/InjectEntityManager'
import Category from '../../entity/Category'
import User from '../../entity/User'
import AuthService from '../auth/AuthService'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryService from '../category/CategoryService'
import PaginatedSchema from '../../schema/pagination/PaginatedSchema'
import Cursor from '../../model/Cursor'
import ExamRepository from '../../repository/ExamRepository'
import CreateExamSchema from '../../schema/exam/CreateExamSchema'
import Exam, { ExamQuestion } from '../../entity/Exam'
import ExamTakenError from '../../error/exam/ExamTakenError'
import ExamNotFoundError from '../../error/exam/ExamNotFoundError'
import ExamQuestionSchema from '../../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswerSchema from '../../schema/exam/CreateExamQuestionAnswerSchema'
import QuestionService from '../question/QuestionService'
import Question, { QuestionChoice, QuestionType } from '../../entity/Question'
import { ObjectId } from 'mongodb'
import AuthorizationFailedError from '../../error/auth/AuthorizationFailedError'
import ExamQuerySchema from '../../schema/exam/ExamQuerySchema'
import ExamQuestionNumberNotFoundError from '../../error/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enum/exam/ExamPermission'

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
      .map((question: Question): ExamQuestion => (new ExamQuestion())
        .setQuestion(question.getId()))

    const exam = (new Exam())
      .setCategory(category.getId())
      .setQuestions(questions)
      .setCreator(initiator.getId())
      .setOwner(initiator.getId())

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

    const questions = exam.getQuestions()

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    const examQuestion = new ExamQuestionSchema()
    const question = await this.questionService.getQuestion(questions[questionNumber].getQuestion())

    examQuestion.question = question.getTitle()
    examQuestion.difficulty = question.getDifficulty()
    examQuestion.type = question.getType()

    if (examQuestion.type === QuestionType.CHOICE) {
      examQuestion.choices = question.getChoices().map((choice: QuestionChoice) => choice.getTitle())
      examQuestion.choice = questions[questionNumber].getChoice()
    } else if (examQuestion.type === QuestionType.TYPE) {
      examQuestion.answer = questions[questionNumber].getAnswer()
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

    const questions = exam.getQuestions()

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    if (exam.getOwner() !== initiator.getId()) {
      return exam
    }

    exam.setLastRequestedQuestionNumber(questionNumber)
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

    const questions = exam.getQuestions()
    const question = await this.questionService.getQuestion(questions[questionNumber].getQuestion())

    if (question.getType() === QuestionType.CHOICE) {
      questions[questionNumber].setChoice(examQuestionAnswer.choice)
    } else if (question.getType() === QuestionType.TYPE) {
      questions[questionNumber].setAnswer(examQuestionAnswer.answer)
    }

    // todo: optimize
    exam.setQuestions(questions)

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
        where['owner'] = initiator.getId()
      } else {
        throw error
      }
    }

    if (query.category) {
      where['category'] = new ObjectId(query.category)
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

    const category = await this.categoryService.getCategory(exam.getCategory())
    const questions = await this.questionService.queryCategoryQuestions(category) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.getId().toString()] = question
    }

    let correctAnswers = 0

    for (const examQuestion of exam.getQuestions()) {
      const question = questionsHashedById[examQuestion.getQuestion().toString()]

      if (typeof examQuestion.getChoice() !== 'undefined') {
        if (this.questionService.checkChoice(examQuestion.getChoice(), question)) {
          correctAnswers++
        }
      } else if (typeof examQuestion.getAnswer() !== 'undefined') {
        if (this.questionService.checkAnswer(examQuestion.getAnswer(), question)) {
          correctAnswers++
        }
      }
    }

    exam.setCorrectAnswers(correctAnswers)
      .setCompleted(new Date())

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
    const existing = await this.examRepository.findOneNotCompletedByCategoryAndCreator(category.getId(), user.getId())

    if (existing) {
      throw new ExamTakenError(existing)
    }
  }
}