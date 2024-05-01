import { MongoRepository } from 'typeorm'
import Repository from '../decorators/Repository'
import { ObjectId } from 'mongodb'
import Question from '../entities/Question'

@Repository(Question)
export default class QuestionRepository extends MongoRepository<Question> {

  public async findOneById(id: ObjectId): Promise<Question | null> {
    return await this.findOneBy({ _id: id })
  }

  public async findOneByTitle(title: string, ignoreId: ObjectId = undefined): Promise<Question | null> {
    const where = { title }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }
}