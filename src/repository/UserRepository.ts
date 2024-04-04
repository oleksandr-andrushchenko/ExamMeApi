import { MongoRepository } from 'typeorm'
import { ObjectId } from 'mongodb'
import User from '../entity/User'
import Repository from '../decorator/Repository'

@Repository(User)
export default class UserRepository extends MongoRepository<User> {

  public async findOneById(id: ObjectId): Promise<User | null> {
    return await this.findOneBy({ _id: id })
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email })
  }
}