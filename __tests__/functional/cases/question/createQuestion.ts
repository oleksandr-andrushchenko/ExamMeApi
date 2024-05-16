import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import User from '../../../../src/entities/User'
import { ObjectId } from 'mongodb'
import Question, { QuestionDifficulty, QuestionType } from '../../../../src/entities/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { addQuestionMutation } from '../../graphql/question/addQuestionMutation'
import QuestionSchema from '../../../../src/schema/question/QuestionSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create question', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const question = {
      categoryId: category.id.toString(),
      title: 'any',
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (category not found)', async () => {
    const categoryId = await framework.fakeId()
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const question = {
      categoryId: categoryId.toString(),
      title: 'any',
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  // todo: add cases
  test.each([
    { case: 'empty body', body: {}, times: 3 },
    { case: 'no title', body: { type: QuestionType.TYPE, difficulty: QuestionDifficulty.EASY }, times: 1 },
    { case: 'no type', body: { title: 'any', difficulty: QuestionDifficulty.EASY }, times: 1 },
    { case: 'bad type', body: { title: 'any', type: 'any', difficulty: QuestionDifficulty.EASY }, times: 1 },
    { case: 'no difficulty', body: { title: 'any', type: QuestionType.TYPE }, times: 1 },
    { case: 'bad difficulty', body: { title: 'any', type: QuestionType.TYPE, difficulty: 'any' }, times: 1 },
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
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const question = { ...body, ...{ categoryId: category.id.toString() } } as QuestionSchema
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  // todo: add cases
  test('Forbidden', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const question = {
      categoryId: category.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
      answers: [
        {
          variants: [ faker.lorem.word() ],
          correct: true,
          explanation: faker.lorem.sentence(),
        },
      ],
    }
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await framework.fixture<Category>(Category)
    const question1 = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const question = {
      categoryId: category.id.toString(),
      title: question1.title,
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
      answers: [
        {
          variants: [ faker.lorem.word() ],
          correct: true,
          explanation: faker.lorem.sentence(),
        },
      ],
    }
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  // todo: add cases
  test('Created', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const question = {
      categoryId: category.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
      answers: [
        {
          variants: [ faker.lorem.word() ],
          correct: true,
          explanation: faker.lorem.sentence(),
        },
      ],
    }
    const fields = [
      'id',
      'categoryId',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'answers {variants correct explanation}',
      'voters',
      'rating',
      'ownerId',
      'createdAt',
      'updatedAt',
    ]
    const now = Date.now()
    const res = await request(framework.app).post('/').send(addQuestionMutation({ question }, fields)).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addQuestion: question } })
    expect(res.body.data.addQuestion).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addQuestion.id)
    const latestQuestion = await framework.load<Question>(Question, id)
    expect(latestQuestion).toMatchObject({ ...question, ...{ categoryId: category.id } })
    expect(res.body.data.addQuestion).toEqual({
      id: latestQuestion.id.toString(),
      categoryId: latestQuestion.categoryId.toString(),
      type: latestQuestion.type,
      difficulty: latestQuestion.difficulty,
      title: latestQuestion.title,
      choices: latestQuestion.choices ?? null,
      answers: latestQuestion.answers?.map(answer => {
        return { ...answer }
      }) ?? null,
      voters: latestQuestion.voters,
      rating: latestQuestion.rating,
      ownerId: latestQuestion.ownerId.toString(),
      createdAt: latestQuestion.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestQuestion.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addQuestion).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})