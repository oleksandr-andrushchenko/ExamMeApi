import app from '../src/app'
import { afterAll, beforeAll, beforeEach } from '@jest/globals'
import Category from '../src/entities/Category'
import User from '../src/entities/User'
import { faker } from '@faker-js/faker'
import { ConnectionManager } from 'typeorm'
import { Container } from 'typedi'
import AuthService from '../src/services/auth/AuthService'
import TokenSchema from '../src/schema/auth/TokenSchema'
import CategoryRepository from '../src/repositories/CategoryRepository'
import UserRepository from '../src/repositories/UserRepository'
import Permission from '../src/enums/Permission'
import { ObjectId } from 'mongodb'
import QuestionRepository from '../src/repositories/QuestionRepository'
import Question, { QuestionAnswer, QuestionChoice, QuestionDifficulty, QuestionType } from '../src/entities/Question'
import Exam, { ExamQuestion } from '../src/entities/Exam'
import ExamRepository from '../src/repositories/ExamRepository'

const api = app().api()

const clear = async () => {
  await Container.get<UserRepository>(UserRepository).clear()
  await Container.get<CategoryRepository>(CategoryRepository).clear()
  await Container.get<QuestionRepository>(QuestionRepository).clear()
  await Container.get<ExamRepository>(ExamRepository).clear()
}

beforeAll(() => api.up())
beforeEach(() => clear())
afterAll(() => api.down())

export const server = api.app

export const fixture = async <Entity>(entity: any, options: object = {}): Promise<Entity> => {
  let object: any

  switch (entity) {
    case User:
      object = new User()
      object.name = faker.person.fullName()
      object.email = faker.internet.email()
      object.password = options['password'] ?? faker.internet.password()
      object.permissions = options['permissions'] ?? [ Permission.REGULAR ]

      break
    case Category:
      object = new Category()
      object.name = faker.lorem.word()
      object.creator = options['creator'] ?? (await fixture(User, options) as User).id
      object.owner = options['owner'] ?? object.creator

      break
    case Question:
      object = new Question()
      object.category = options['category'] ?? (await fixture(Category, options) as Category).id
      object.type = faker.helpers.enumValue(QuestionType)
      object.difficulty = faker.helpers.enumValue(QuestionDifficulty)
      object.title = faker.lorem.sentences(3)
      object.creator = options['creator'] ?? (await fixture(User, options) as User).id
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
    case Exam:
      object = new Exam()
      object.category = options['category'] ?? (await fixture(Category, options) as Category).id
      object.creator = options['creator'] ?? (await fixture(User, options) as User).id
      object.owner = options['owner'] ?? object.creator

      const questions = []

      for (let i = 0, max = faker.number.int({ min: 1, max: 3 }); i < max; i++) {
        const question = await fixture(Question, { ...options, ...{ category: object.category } }) as Question
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
      throw new Error(`Unknown "${ entity.toString() }" type passed`)
  }

  object.created = faker.date.anytime()

  if (faker.datatype.boolean()) {
    object.updated = faker.date.anytime()
  }

  if (options['deleted'] ?? false) {
    object.deleted = faker.date.anytime()
  }

  await Container.get<ConnectionManager>(ConnectionManager).get('default').manager.save(object)

  return object
}

export const load = async <Entity>(entity: any, id: ObjectId): Promise<Entity> => {
  switch (entity) {
    case User:
      return await Container.get<UserRepository>(UserRepository).findOneById(id) as any
    case Category:
      return await Container.get<CategoryRepository>(CategoryRepository).findOneById(id) as any
    case Question:
      return await Container.get<QuestionRepository>(QuestionRepository).findOneById(id) as any
    case Exam:
      return await Container.get<ExamRepository>(ExamRepository).findOneById(id) as any
    default:
      throw new Error(`Unknown "${ entity.toString() }" type passed`)
  }
}

export const error = (name: string = '', message: string = '', errors: string[] = []) => {
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

export const graphqlError = (...names: string[]) => {
  return {
    errors: names.map(name => {
      return { extensions: { name } }
    }),
  }
}

export const auth = async (user: User): Promise<TokenSchema> => {
  const authService: AuthService = Container.get<AuthService>(AuthService)

  return await authService.createAuth(user)
}

export const fakeId = async (): Promise<ObjectId> => ObjectId.createFromTime(Date.now())