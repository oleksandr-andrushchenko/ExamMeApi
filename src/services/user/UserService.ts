import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import InjectEventDispatcher, { EventDispatcherInterface } from '../../decorators/InjectEventDispatcher'
import UserRepository from '../../repositories/UserRepository'
import * as bcrypt from 'bcrypt'
import UserNotFoundError from '../../errors/user/UserNotFoundError'
import UserWrongCredentialsError from '../../errors/user/UserWrongCredentialsError'
import UserEmailTakenError from '../../errors/user/UserEmailTakenError'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import UserSchema from '../../schema/user/UserSchema'
import { CredentialsSchema } from '../../schema/auth/CredentialsSchema'
import Permission from '../../enums/Permission'
import AuthService from '../auth/AuthService'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'mongodb'
import UserEmailNotFoundError from '../../errors/user/UserEmailNotFoundError'

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
   * @param {UserSchema} transfer
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async createUser(transfer: UserSchema, initiator: User): Promise<User> {
    await this.authService.verifyAuthorization(initiator, UserPermission.CREATE)

    await this.validator.validate(transfer)

    const email = transfer.email
    await this.verifyUserEmailNotExists(email)

    const user = new User()
    user.email = email
    user.password = transfer.password
    user.permissions = transfer.permissions ?? [ Permission.REGULAR ]
    user.creatorId = initiator.id

    if ('name' in transfer) {
      user.name = transfer.name
    }

    user.createdAt = new Date()

    await this.entityManager.save<User>(user)

    this.eventDispatcher.dispatch('userCreated', { user })

    return user
  }

  /**
   * @param {CredentialsSchema} transfer
   * @returns {Promise<User | null>}
   * @throws {UserWrongCredentialsError}
   * @throws {UserEmailNotFoundError}
   */
  public async getUserByCredentials(transfer: CredentialsSchema): Promise<User | null> {
    await this.validator.validate(transfer)

    const email: string = transfer.email
    const user: User = await this.getUserByEmail(email)

    if (!await this.compareUserPassword(user, transfer.password)) {
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
}