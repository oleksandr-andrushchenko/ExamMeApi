import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import Question from '../entities/Question'
import EntityRepository from './EntityRepository'

@Repository(Question)
export default class QuestionRepository extends EntityRepository<Question> {

  public async findOneByTitle(title: string, ignoreId: ObjectId = undefined): Promise<Question | null> {
    const where = { title }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }
}