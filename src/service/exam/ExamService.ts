import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorator/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorator/InjectEntityManager'
import Category from '../../entity/Category'
import User from '../../entity/User'
import AuthService from '../auth/AuthService'
import Permission from '../../enum/auth/Permission'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryService from '../category/CategoryService'
import ExamRepository from '../../repository/ExamRepository'
import CreateExamSchema from '../../schema/exam/CreateExamSchema'
import Exam, { ExamQuestion as ExamQuestionItem } from '../../entity/Exam'
import ExamTakenError from '../../error/exam/ExamTakenError'
import QuestionService from '../question/QuestionService'
import Question from '../../entity/Question'

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
    await this.authService.verifyAuthorization(initiator, Permission.CREATE_EXAM)

    await this.validator.validate(transfer)
    const category = await this.categoryService.getCategory(transfer.category)

    await this.verifyExamNotTaken(category, initiator)

    const questions = (await this.questionService.queryCategoryQuestions(category) as Question[])
      .map((question: Question): ExamQuestionItem => (new ExamQuestionItem())
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