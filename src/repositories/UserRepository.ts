import User from '../entities/User'
import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'

@Repository(User)
export default class UserRepository extends EntityRepository<User> {

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email })
  }
}