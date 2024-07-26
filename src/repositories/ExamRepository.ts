import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import Exam from '../entities/Exam'
import EntityRepository from './EntityRepository'
import User from '../entities/User'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {

  public async findOneNotCompletedByCategoryAndOwner(categoryId: ObjectId, owner: User): Promise<Exam | null> {
    return await this.findOne({
      where: {
        categoryId: categoryId,
        ownerId: owner.id,
        completedAt: { $exists: false },
      },
    })
  }

  public async findNonCompletedByCategoryAndOwner(categoryIds: ObjectId[], owner: User): Promise<Exam[]> {
    return await this.find({
      where: {
        categoryId: { $in: categoryIds },
        ownerId: owner.id,
        completedAt: { $exists: false },
      },
    })
  }
}