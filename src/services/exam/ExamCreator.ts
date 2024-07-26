import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryProvider from '../category/CategoryProvider'
import CreateExam from '../../schema/exam/CreateExam'
import Exam from '../../entities/Exam'
import Question from '../../entities/Question'
import ExamPermission from '../../enums/exam/ExamPermission'
import ExamQuestion from '../../entities/exam/ExamQuestion'
import ExamVerifier from './ExamVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import CategoryQuestionsProvider from '../question/CategoryQuestionsProvider'

@Service()
export default class ExamCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly categoryQuestionsProvider: CategoryQuestionsProvider,
    @Inject() private readonly examVerifier: ExamVerifier,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
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
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Create)

    await this.validator.validate(createExam)
    const category = await this.categoryProvider.getCategory(createExam.categoryId)

    await this.examVerifier.verifyExamNotTaken(category, initiator)

    const questions = (await this.categoryQuestionsProvider.getCategoryQuestions(category) as Question[])
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
}