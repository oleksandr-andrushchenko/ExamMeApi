import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
import Question, { QuestionDifficulty, QuestionType } from '../../../src/entities/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'

describe('POST /questions', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post(`/questions`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (category not found)', async () => {
    const categoryId = await fakeId()
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post(`/questions`).send({
      title: 'any',
      category: categoryId,
    }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  // todo: add cases
  test.each([
    { case: 'empty body', body: {} },
    { case: 'no title', body: { type: QuestionType.TYPE, difficulty: QuestionDifficulty.EASY } },
    { case: 'no type', body: { title: 'any', difficulty: QuestionDifficulty.EASY } },
    { case: 'bad type', body: { title: 'any', type: 'any', difficulty: QuestionDifficulty.EASY } },
    { case: 'no difficulty', body: { title: 'any', type: QuestionType.TYPE } },
    { case: 'bad difficulty', body: { title: 'any', type: QuestionType.TYPE, difficulty: 'any' } },
    { case: 'no choices', body: { title: 'any', type: QuestionType.CHOICE, difficulty: QuestionDifficulty.EASY } },
    {
      case: 'non-array choices',
      body: { title: 'any', type: QuestionType.CHOICE, difficulty: QuestionDifficulty.EASY, choices: 'any' },
    },
    {
      case: 'no choice title',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        difficulty: QuestionDifficulty.EASY,
        choices: [ { correct: false } ],
      },
    },
    {
      case: 'no choice correct',
      body: {
        title: 'any',
        type: QuestionType.CHOICE,
        difficulty: QuestionDifficulty.EASY,
        choices: [ { title: 'any' } ],
      },
    },
  ])('Bad request ($case)', async ({ body }) => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post(`/questions`).send({ ...body, ...{ category: categoryId } }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  // todo: add cases
  test('Forbidden', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const schema = {
      category: categoryId.toString(),
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
    const res = await request(app).post(`/questions`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const question = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post(`/questions`)
      .send({
        category: categoryId,
        title: question.title,
        type: QuestionType.TYPE,
        difficulty: QuestionDifficulty.EASY,
        answers: [
          {
            variants: [ faker.lorem.word() ],
            correct: true,
            explanation: faker.lorem.sentence(),
          },
        ],
      })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })

  // todo: add cases
  test('Created', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const schema = {
      category: categoryId.toString(),
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
    const res = await request(app).post(`/questions`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    expect(res.body).toMatchObject(schema)
    expect(await load<Question>(Question, id)).toMatchObject({ ...schema, ...{ category: categoryId } })
  })
})