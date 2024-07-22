import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import UserRepository from '../../repositories/UserRepository'
import UserNotFoundError from '../../errors/user/UserNotFoundError'
import UserWrongCredentialsError from '../../errors/user/UserWrongCredentialsError'
import { Credentials } from '../../schema/auth/Credentials'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'mongodb'
import UserEmailNotFoundError from '../../errors/user/UserEmailNotFoundError'
import Cursor from '../../models/Cursor'
import GetUsers from '../../schema/user/GetUsers'
import PaginatedUsers from '../../schema/user/PaginatedUsers'
import UserPasswordManager from './UserPasswordManager'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class UserProvider {

  public constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly userPasswordManager: UserPasswordManager,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Credentials} credentials
   * @returns {Promise<User | null>}
   * @throws {UserWrongCredentialsError}
   * @throws {UserEmailNotFoundError}
   */
  public async getUserByCredentials(credentials: Credentials): Promise<User | null> {
    await this.validator.validate(credentials)

    const email: string = credentials.email
    const user: User = await this.getUserByEmail(email)

    if (!await this.userPasswordManager.compareUserPassword(user, credentials.password)) {
      throw new UserWrongCredentialsError()
    }

    return user
  }

  /**
   * @param {string} email
   * @returns {Promise<User>}
   * @throws {UserEmailNotFoundError}
   */
  public async getUserByEmail(email: string): Promise<User> {
    const user: User = await this.userRepository.findOneByEmail(email)

    if (!user) {
      throw new UserEmailNotFoundError(email)
    }

    return user
  }

  /**
   * @param {ObjectId | string} id
   * @returns {Promise<User>}
   * @throws {UserNotFoundError}
   */
  public async getUser(id: ObjectId | string): Promise<User> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const user: User = await this.userRepository.findOneById(id)

    if (!user) {
      throw new UserNotFoundError(id)
    }

    return user
  }

  /**
   * @param {GetUsers} getUsers
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<User[] | PaginatedUsers>}
   * @throws {ValidatorError}
   * @throws {AuthorizationFailedError}
   */
  public async getUsers(
    getUsers: GetUsers,
    meta: boolean,
    initiator: User,
  ): Promise<User[] | PaginatedUsers> {
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Get)
    await this.validator.validate(getUsers)

    const cursor = new Cursor<User>(getUsers, this.userRepository)

    const where = {}

    if ('search' in getUsers) {
      where['$or'] = [
        { 'name': { $regex: getUsers.search, $options: 'i' } },
        { 'email': { $regex: getUsers.search, $options: 'i' } },
      ]
    }

    return await cursor.getPaginated({ where, meta })
  }
}