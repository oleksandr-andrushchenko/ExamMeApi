import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import Question from '../../entities/Question'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class QuestionApproveSwitcher {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleQuestionApprove(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Approve)

    if (this.isQuestionApproved(question)) {
      question.ownerId = question.creatorId
    } else {
      question.ownerId = null
    }

    question.updatedAt = new Date()

    await this.entityManager.save<Question>(question)
    this.eventDispatcher.dispatch('questionApproveToggled', { question, initiator })

    return question
  }

  public isQuestionApproved(question: Question): boolean {
    return !question.ownerId
  }
}