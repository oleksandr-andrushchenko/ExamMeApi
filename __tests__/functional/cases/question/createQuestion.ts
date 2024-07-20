import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import { ObjectId } from 'mongodb'
import Question from '../../../../src/entities/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { createQuestion } from '../../graphql/question/createQuestion'
import CreateQuestion from '../../../../src/schema/question/CreateQuestion'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../src/entities/question/QuestionType'
import QuestionDifficulty from '../../../../src/entities/question/QuestionDifficulty'

const framework: TestFramework = globalThis.framework

describe('Create question', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const create = {
      categoryId: category.id.toString(),
      title: 'any',
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (category not found)', async () => {
    const categoryId = await framework.fakeId()
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = {
      categoryId: categoryId.toString(),
      title: 'any',
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  // todo: add cases
  test.each([
    { case: 'empty body', body: {}, times: 3 },
    {
      case: 'no title',
      body: {
        type: QuestionType.CHOICE,
        choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
        difficulty: QuestionDifficulty.EASY,
      },
      times: 1,
    },
    { case: 'no type', body: { title: 'any', difficulty: QuestionDifficulty.EASY }, times: 1 },
    { case: 'bad type', body: { title: 'any', type: 'any', difficulty: QuestionDifficulty.EASY }, times: 1 },
    {
      case: 'no difficulty',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      },
      times: 1,
    },
    {
      case: 'bad difficulty',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
        difficulty: 'any',
      },
      times: 1,
    },
    {
      case: 'no choices',
      body: { title: 'any', type: QuestionType.CHOICE, difficulty: QuestionDifficulty.EASY },
      times: 1,
    },
    {
      case: 'non-array choices',
      body: { title: 'any', type: QuestionType.CHOICE, difficulty: QuestionDifficulty.EASY, choices: 'any' },
      times: 1,
    },
    {
      case: 'no choice title',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        difficulty: QuestionDifficulty.EASY,
        choices: [ { correct: false } ],
      },
      times: 1,
    },
    {
      case: 'no choice correct',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        difficulty: QuestionDifficulty.EASY,
        choices: [ { title: 'any' } ],
      },
      times: 1,
    },
  ])('Bad request ($case)', async ({ body, times }) => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = { ...body, ...{ categoryId: category.id.toString() } } as CreateQuestion
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  // todo: add cases
  test('Forbidden', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const create = {
      categoryId: category.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await framework.fixture<Category>(Category)
    const question1 = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = {
      categoryId: category.id.toString(),
      title: question1.title,
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  // todo: add cases
  test('Created', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = {
      categoryId: category.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.CHOICE,
      choices: [
        {
          title: faker.lorem.sentence(),
        },
        {
          title: faker.lorem.sentences(3),
          correct: faker.datatype.boolean(),
        },
        {
          title: 'Any title 3',
          explanation: faker.lorem.sentence(),
          correct: faker.datatype.boolean(),
        },
      ],
      difficulty: QuestionDifficulty.EASY,
    }
    const fields = [
      'id',
      'categoryId',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'rating {value voterCount}',
      'ownerId',
      'createdAt',
      'updatedAt',
    ]
    const now = Date.now()
    const res = await request(framework.app).post('/').send(createQuestion({ createQuestion: create }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createQuestion: create } })
    expect(res.body.data.createQuestion).toHaveProperty('id')
    const id = new ObjectId(res.body.data.createQuestion.id)
    const latestQuestion = await framework.load<Question>(Question, id)
    expect(latestQuestion).toMatchObject({ ...create, ...{ categoryId: category.id } })
    expect(res.body.data.createQuestion).toEqual({
      id: latestQuestion.id.toString(),
      categoryId: latestQuestion.categoryId.toString(),
      type: latestQuestion.type,
      difficulty: latestQuestion.difficulty,
      title: latestQuestion.title,
      choices: latestQuestion.choices?.map(choice => ({
        title: choice.title,
        correct: choice.correct === undefined ? null : choice.correct,
        explanation: choice.explanation === undefined ? null : choice.explanation,
      })) ?? null,
      rating: null,
      ownerId: latestQuestion.ownerId.toString(),
      createdAt: latestQuestion.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestQuestion.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createQuestion).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})