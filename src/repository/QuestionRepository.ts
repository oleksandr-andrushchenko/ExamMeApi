import { MongoRepository } from 'typeorm'
import Repository from '../decorator/Repository'
import { ObjectId } from 'mongodb'
import Question from '../entity/Question'

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