import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Category from '../../../src/entity/Category'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'
import Question, { QuestionDifficulty, QuestionType } from '../../../src/entity/Question'
import { faker } from '@faker-js/faker'

describe('PUT /questions/:question_id', () => {
  const app = api()

  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).put(`/questions/${ id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_QUESTION ] })
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).put(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_QUESTION ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).put(`/questions/${ id.toString() }`).send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_QUESTION ] })
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).put(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).put(`/questions/${ id.toString() }`).send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REPLACE_CATEGORY ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).put(`/questions/${ id.toString() }`).send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Conflict', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ Permission.REPLACE_QUESTION ] })
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const res = await request(app)
      .put(`/questions/${ id.toString() }`)
      .send({
        category: question.getCategory(),
        title: question1.getTitle(),
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

  test('Replaced', async () => {
    const category = await fixture<Category>(Category)
    const question = await fixture<Question>(Question, { permissions: [ Permission.REPLACE_QUESTION ] })
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const schema = {
      category: category.getId().toString(),
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
    const res = await request(app)
      .put(`/questions/${ id.toString() }`)
      .send(schema)
      .auth(token, { type: 'bearer' })


    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, id)).toMatchObject({ ...schema, ...{ category: category.getId() } })
  })
})