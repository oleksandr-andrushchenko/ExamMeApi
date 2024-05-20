import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import Exam from '../entities/Exam'
import EntityRepository from './EntityRepository'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {

  public async findOneNotCompletedByCategoryAndCreator(categoryId: ObjectId, userId: ObjectId): Promise<Exam | null> {
    return await this.findOneBy({
      categoryId: categoryId,
      creatorId: userId,
      completedAt: { $exists: false },
    })
  }
}