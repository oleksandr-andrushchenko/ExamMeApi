import { MongoRepository } from 'typeorm'
import Repository from '../decorator/Repository'
import { ObjectId } from 'mongodb'
import Question from '../entity/Question'
import Category from '../entity/Category'

@Repository(Question)
export default class QuestionRepository extends MongoRepository<Question> {

  public async findOneById(id: string): Promise<Question | undefined> {
    return await this.findOneBy({ _id: new ObjectId(id) })
  }

  public async findOneByTitle(title: string, ignoreId: ObjectId = undefined): Promise<Question | undefined> {
    const where = { title }

    if (ignoreId) {
      where['_id'] = { $ne: ignoreId }
    }

    return await this.findOneBy(where)
  }

  public async findByCategory(category: Category): Promise<Question[]> {
    return await this.find({ category: category.getId() })
  }
}