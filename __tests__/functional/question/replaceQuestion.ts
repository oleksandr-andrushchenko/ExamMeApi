import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, load, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import User from '../../../src/entities/User'
import Question, { QuestionDifficulty, QuestionType } from '../../../src/entities/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'

describe('Replace question', () => {
  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const res = await request(app).put(`/questions/${ question.id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.REPLACE ] })
    const token = (await auth(user)).token
    const res = await request(app).put('/questions/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.REPLACE ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).put(`/questions/${ id.toString() }`)
      .send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.REPLACE ] })
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const res = await request(app).put(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const schema = {
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
    const res = await request(app).put(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const schema = {
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
    const res = await request(app).put(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ QuestionPermission.REPLACE ] })
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const schema = {
      category: question.category,
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
    const res = await request(app).put(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Replaced (has ownership)', async () => {
    const question = await fixture<Question>(Question)
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const schema = {
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
    const res = await request(app).put(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, question.id)).toMatchObject({ ...schema, ...{ category: category.id } })
  })
  test('Replaced (has permission)', async () => {
    const question = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.REPLACE ] })
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const schema = {
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
    const res = await request(app).put(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, question.id)).toMatchObject({ ...schema, ...{ category: category.id } })
  })
})