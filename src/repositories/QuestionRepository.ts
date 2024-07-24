import Repository from '../decorators/Repository'
import Question from '../entities/Question'
import EntityRepository from './EntityRepository'
import Category from '../entities/Category'

@Repository(Question)
export default class QuestionRepository extends EntityRepository<Question> {

  public async findOneByTitle(title: string): Promise<Question | null> {
    return await this.findOneBy({ title })
  }

  public async countByCategory(category: Category): Promise<number> {
    return await this.count({ categoryId: category.id })
  }

  public async countByCategoryAndNoOwner(category: Category): Promise<number> {
    return await this.count({ categoryId: category.id, ownerId: { $exists: false } })
  }
}