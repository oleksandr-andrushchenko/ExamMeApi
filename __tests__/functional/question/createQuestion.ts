import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
import Question, { QuestionDifficulty, QuestionType } from '../../../src/entities/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { addQuestionMutation } from '../../graphql/question/addQuestionMutation'
import QuestionSchema from '../../../src/schema/question/QuestionSchema'

describe('Create question', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post('/questions')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (category not found)', async () => {
    const categoryId = await fakeId()
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/questions').send({
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
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/questions')
      .send({ ...body, ...{ category: category.id } })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  // todo: add cases
  test('Forbidden', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const question = {
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
    const res = await request(app).post('/questions').send(question).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category = await fixture<Category>(Category)
    const question = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app)
      .post('/questions')
      .send({
        category: category.id,
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
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const question = {
      category: category.id.toString(),
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
    const now = Date.now()
    const res = await request(app).post('/questions').send(question).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject(question)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    const latestQuestion = await load<Question>(Question, id)
    expect(latestQuestion).toMatchObject({ ...question, ...{ category: category.id } })
    expect(res.body).toEqual({
      id: latestQuestion.id.toString(),
      category: latestQuestion.category.toString(),
      type: latestQuestion.type,
      difficulty: latestQuestion.difficulty,
      title: latestQuestion.title,
      answers: latestQuestion.answers?.map(answer => {
        return { ...answer }
      }) ?? null,
      voters: latestQuestion.voters,
      rating: latestQuestion.rating,
      owner: latestQuestion.owner.toString(),
      created: latestQuestion.created.getTime(),
    })
    expect(latestQuestion.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body).not.toHaveProperty([ 'choices', 'creator', 'updated', 'deleted' ])
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const question = {
      category: category.id.toString(),
      title: 'any',
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (category not found) (GraphQL)', async () => {
    const categoryId = await fakeId()
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const question = {
      category: categoryId.toString(),
      title: 'any',
      type: QuestionType.TYPE,
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
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
  ])('Bad request ($case) (GraphQL)', async ({ body, times }) => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const question = { ...body, ...{ category: category.id.toString() } } as QuestionSchema
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError(...Array(times).fill('BadRequestError')))
  })
  // todo: add cases
  test('Forbidden (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const question = {
      category: category.id.toString(),
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
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const question1 = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const question = {
      category: category.id.toString(),
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
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question })).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  // todo: add cases
  test('Created (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.CREATE ] })
    const token = (await auth(user)).token
    const question = {
      category: category.id.toString(),
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
      'category',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'answers {variants correct explanation}',
      'voters',
      'rating',
      'owner',
      'created',
      'updated',
    ]
    const now = Date.now()
    const res = await request(app).post('/graphql').send(addQuestionMutation({ question }, fields)).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addQuestion: question } })
    expect(res.body.data.addQuestion).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addQuestion.id)
    const latestQuestion = await load<Question>(Question, id)
    expect(latestQuestion).toMatchObject({ ...question, ...{ category: category.id } })
    expect(res.body.data.addQuestion).toEqual({
      id: latestQuestion.id.toString(),
      category: latestQuestion.category.toString(),
      type: latestQuestion.type,
      difficulty: latestQuestion.difficulty,
      title: latestQuestion.title,
      choices: latestQuestion.choices ?? null,
      answers: latestQuestion.answers?.map(answer => {
        return { ...answer }
      }) ?? null,
      voters: latestQuestion.voters,
      rating: latestQuestion.rating,
      owner: latestQuestion.owner.toString(),
      created: latestQuestion.created.getTime(),
      updated: null,
    })
    expect(latestQuestion.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addQuestion).not.toHaveProperty([ 'creator', 'deleted' ])
  })
})