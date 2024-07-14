import Repository from '../decorators/Repository'
import Question from '../entities/Question'
import EntityRepository from './EntityRepository'

@Repository(Question)
export default class QuestionRepository extends EntityRepository<Question> {

  public async findOneByTitle(title: string): Promise<Question | null> {
    return await this.findOneBy({ title })
  }
}