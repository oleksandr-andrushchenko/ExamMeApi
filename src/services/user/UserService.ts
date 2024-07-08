import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import UserRepository from '../../repositories/UserRepository'
import * as bcrypt from 'bcrypt'
import UserNotFoundError from '../../errors/user/UserNotFoundError'
import UserWrongCredentialsError from '../../errors/user/UserWrongCredentialsError'
import UserEmailTakenError from '../../errors/user/UserEmailTakenError'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import CreateUser from '../../schema/user/CreateUser'
import { Credentials } from '../../schema/auth/Credentials'
import Permission from '../../enums/Permission'
import AuthService from '../auth/AuthService'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'mongodb'
import UserEmailNotFoundError from '../../errors/user/UserEmailNotFoundError'
import Cursor from '../../models/Cursor'
import GetUsers from '../../schema/user/GetUsers'
import PaginatedUsers from '../../schema/user/PaginatedUsers'

@Service()
export default class UserService {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly authService: AuthService,
    @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateUser} createUser
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async createUser(createUser: CreateUser, initiator: User): Promise<User> {
    await this.authService.verifyAuthorization(initiator, UserPermission.CREATE)

    await this.validator.validate(createUser)

    const email = createUser.email
    await this.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = createUser.password
    user.permissions = createUser.permissions ?? [ Permission.REGULAR ]
    user.creatorId = initiator.id

    if ('name' in createUser) {
      user.name = createUser.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)

    this.eventDispatcher.dispatch('userCreated', { user })

    return user
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

    if (!await this.compareUserPassword(user, credentials.password)) {
      throw new UserWrongCredentialsError()
    }

    return user
  }

  public async hashUserPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return reject(err)
        }

        resolve(hash)
      })
    })
  }

  public async compareUserPassword(user: User, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      bcrypt.compare(password, user.password, (_, res) => {
        resolve(res === true)
      })
    })
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
   * @param {string} email
   * @returns {Promise<void>}
   * @throws {UserEmailTakenError}
   */
  public async verifyUserEmailNotExists(email: string): Promise<void> {
    if (await this.userRepository.findOneByEmail(email)) {
      throw new UserEmailTakenError(email)
    }
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
    await this.authService.verifyAuthorization(initiator, UserPermission.Get)
    await this.validator.validate(getUsers)

    const cursor = new Cursor<User>(getUsers, this.userRepository)

    const where = {}

    if ('search' in getUsers) {
      where['name'] = { $regex: getUsers.search, $options: 'i' }
    }

    return await cursor.getPaginated(where, meta)
  }
}