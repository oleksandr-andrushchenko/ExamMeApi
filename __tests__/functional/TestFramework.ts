import { Container, ContainerInstance } from 'typedi'
import UserRepository from '../../src/repositories/UserRepository'
import CategoryRepository from '../../src/repositories/CategoryRepository'
import QuestionRepository from '../../src/repositories/QuestionRepository'
import ExamRepository from '../../src/repositories/ExamRepository'
import User from '../../src/entities/User'
import { faker } from '@faker-js/faker'
import Permission from '../../src/enums/Permission'
import Category from '../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../../src/entities/Question'
import Exam, { ExamQuestion } from '../../src/entities/Exam'
import { ConnectionManager } from 'typeorm'
import { ObjectId } from 'mongodb'
import TokenSchema from '../../src/schema/auth/TokenSchema'
import AuthService from '../../src/services/auth/AuthService'
import { Application } from 'express'

export default class TestFramework {

  public readonly app: Application

  public readonly container: ContainerInstance

  public readonly appUp: (listen?: boolean) => Promise<void>

  public readonly appDown: (callback?: () => {}) => Promise<void>

  public constructor() {
    const { app, appUp, appDown } = require('../../src/app')
    this.app = app
    this.container = Container as unknown as ContainerInstance
    this.appUp = appUp
    this.appDown = appDown
  }

  public async clear(_entity: any | any[] = [ User, Category, Question, Exam ]) {
    _entity = Array.isArray(_entity) ? _entity : [ _entity ]

    for (const entity of _entity) {
      switch (true) {
        case this.compare(entity, User):
          await this.container.get<UserRepository>(UserRepository).clear()
          break
        case this.compare(entity, Category):
          await this.container.get<CategoryRepository>(CategoryRepository).clear()
          break
        case this.compare(entity, Question):
          await this.container.get<QuestionRepository>(QuestionRepository).clear()
          break
        case this.compare(entity, Exam):
          await this.container.get<ExamRepository>(ExamRepository).clear()
          break
        default:
          throw new Error(`Clear: Unknown "${ entity.toString() }" type passed`)
      }
    }
  }

  public compare(entity1: any, entity2: any): boolean {
    return (entity1 === entity2) || (entity1.toString() === entity2.toString())
  }

  public async fixture<Entity>(entity: any, options: object = {}): Promise<Entity> {
    let object: any

    switch (true) {
      case this.compare(entity, User):
        object = new User()
        object.name = faker.person.fullName()
        object.email = faker.internet.email()
        object.password = options['password'] ?? faker.internet.password()
        object.permissions = options['permissions'] ?? [ Permission.REGULAR ]

        break
      case this.compare(entity, Category):
        object = new Category()
        object.name = faker.lorem.word()
        object.creator = options['creator'] ?? (await this.fixture(User, options) as User).id
        object.owner = options['owner'] ?? object.creator

        break
      case this.compare(entity, Question):
        object = new Question()
        object.category = options['category'] ?? (await this.fixture(Category, options) as Category).id
        object.type = faker.helpers.enumValue(QuestionType)
        object.difficulty = faker.helpers.enumValue(QuestionDifficulty)
        object.title = faker.lorem.sentences(3)
        object.creator = options['creator'] ?? (await this.fixture(User, options) as User).id
        object.owner = options['owner'] ?? object.creator

        if (object.type === QuestionType.TYPE) {
          const answers = []

          for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
            const answer = new QuestionAnswer()
            answer.variants = [ faker.lorem.word() ]

            if (faker.datatype.boolean()) {
              answer.correct = true
            }

            if (faker.datatype.boolean()) {
              answer.explanation = faker.lorem.sentence()
            }

            answers.push(answer)
          }

          object.answers = answers
        } else if (object.type === QuestionType.CHOICE) {
          const choices = []

          for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
            const choice = new QuestionChoice()
            choice.title = faker.lorem.word()

            if (faker.datatype.boolean()) {
              choice.correct = true
            }

            if (faker.datatype.boolean()) {
              choice.explanation = faker.lorem.sentence()
            }

            choices.push(choice)
          }

          object.choices = choices
        }

        break
      case this.compare(entity, Exam):
        object = new Exam()
        object.category = options['category'] ?? (await this.fixture(Category, options) as Category).id
        object.creator = options['creator'] ?? (await this.fixture(User, options) as User).id
        object.owner = options['owner'] ?? object.creator

        const questions = []

        for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
          const question = await this.fixture(Question, { ...options, ...{ category: object.category } }) as Question
          const examQuestion = new ExamQuestion()
          examQuestion.question = question.id

          if (faker.datatype.boolean()) {
            if (question.type === QuestionType.CHOICE) {
              examQuestion.choice = faker.number.int({ min: 0, max: question.choices.length - 1 })
            } else if (question.type === QuestionType.TYPE) {
              const variants = question.answers[faker.number.int({
                min: 0,
                max: question.answers.length - 1,
              })].variants
              examQuestion.answer = variants[faker.number.int({ min: 0, max: variants.length - 1 })]
            }
          }

          questions.push(examQuestion)
        }

        object.questions = questions
        object.questionNumber = faker.number.int({ min: 0, max: questions.length - 1 })

        if (options['completed'] ?? faker.datatype.boolean()) {
          object.correctCount = faker.number.int({ min: 0, max: questions.length })
          object.completed = options['completed'] ?? new Date()
        }

        break
      default:
        throw new Error(`Fixture: Unknown "${ entity.toString() }" type passed`)
    }

    object.created = faker.date.anytime()

    if (faker.datatype.boolean()) {
      object.updated = faker.date.anytime()
    }

    if (options['deleted'] ?? false) {
      object.deleted = faker.date.anytime()
    }

    await this.container.get<ConnectionManager>(ConnectionManager).get('default').manager.save(object)

    return object
  }

  public async load<Entity>(entity: any, id: ObjectId): Promise<Entity> {
    switch (true) {
      case this.compare(entity, User):
        return await this.container.get<UserRepository>(UserRepository).findOneById(id) as any
      case this.compare(entity, Category):
        return await this.container.get<CategoryRepository>(CategoryRepository).findOneById(id) as any
      case this.compare(entity, Question):
        return await this.container.get<QuestionRepository>(QuestionRepository).findOneById(id) as any
      case this.compare(entity, Exam):
        return await this.container.get<ExamRepository>(ExamRepository).findOneById(id) as any
      default:
        throw new Error(`Load: Unknown "${ entity.toString() }" type passed`)
    }
  }

  public error(name: string = '', message: string = '', errors: string[] = []) {
    const body = {}

    if (name) {
      body['name'] = name
    }

    if (message) {
      body['message'] = message
    }

    if (errors.length > 0) {
      body['errors'] = errors
    }

    return body
  }

  public graphqlError(...names: string[]) {
    return {
      errors: names.map(name => {
        return { extensions: { name } }
      }),
    }
  }

  public async auth(user: User): Promise<TokenSchema> {
    const authService: AuthService = this.container.get<AuthService>(AuthService)

    return await authService.createAuth(user)
  }

  public async fakeId(): Promise<ObjectId> {
    return ObjectId.createFromTime(Date.now())
  }
}