import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamRepository from '../../repositories/ExamRepository'
import Exam from '../../entities/exam/Exam'
import GetCurrentExams from '../../schema/exam/GetCurrentExams'
import IdNormalizer from '../normalizers/IdNormalizer'

@Service()
export default class CurrentExamListProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly idNormalizer: IdNormalizer,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetCurrentExams} getCurrentExams
   * @param {User} initiator
   * @returns {Promise<Exam[]>}
   * @throws {ValidatorError}
   */
  public async getCurrentExams(getCurrentExams: GetCurrentExams, initiator: User): Promise<Exam[]> {
    await this.validator.validate(getCurrentExams)

    const categoryIds = getCurrentExams.categoryIds.map(categoryId => this.idNormalizer.normalizeId(categoryId))

    return await this.examRepository.findNonCompletedByCategoryAndOwner(categoryIds, initiator)
  }
}