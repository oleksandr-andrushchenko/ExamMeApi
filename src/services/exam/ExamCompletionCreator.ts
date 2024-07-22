import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import CategoryProvider from '../category/CategoryProvider'
import Exam from '../../entities/Exam'
import Question from '../../entities/Question'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import CategoryQuestionsProvider from '../question/CategoryQuestionsProvider'

@Service()
export default class ExamCompletionCreator {

  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly categoryQuestionsProvider: CategoryQuestionsProvider,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamCompletion(exam: Exam, initiator: User): Promise<void> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.CreateCompletion, exam)

    const category = await this.categoryProvider.getCategory(exam.categoryId)
    const questions = await this.categoryQuestionsProvider.getCategoryQuestions(category) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.id.toString()] = question
    }

    let correctAnswerCount = 0

    for (const examQuestion of exam.questions) {
      const question = questionsHashedById[examQuestion.questionId.toString()]

      if (typeof examQuestion.choice !== 'undefined') {
        if ((question.choices || [])[examQuestion.choice]?.correct) {
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
}