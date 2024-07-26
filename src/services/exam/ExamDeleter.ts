import { Inject, Service } from 'typedi'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/User'
import Exam from '../../entities/Exam'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteExam(exam: Exam, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Delete, exam)

    exam.deletedAt = new Date()

    await this.entityManager.save<Exam>(exam)
    this.eventDispatcher.dispatch('examDeleted', { exam })

    return exam
  }
}