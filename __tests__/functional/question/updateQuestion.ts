import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Question from '../../../src/entity/Question'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'
import { faker } from '@faker-js/faker'

describe('PATCH /questions/:question_id', () => {
  const app = api()

  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).patch(`/questions/${ id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.UPDATE_QUESTION ] })
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).patch(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.UPDATE_QUESTION ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app)
      .patch(`/questions/${ id.toString() }`)
      .send({ title: 'any' })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.UPDATE_QUESTION ] })
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).patch(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app)
      .patch(`/questions/${ id.toString() }`)
      .send({ title: 'any' })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.UPDATE_QUESTION ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app)
      .patch(`/questions/${ id.toString() }`)
      .send({ title: 'any' })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Conflict', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ Permission.UPDATE_QUESTION ] })
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const res = await request(app)
      .patch(`/questions/${ id.toString() }`)
      .send({ title: question1.getTitle() })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })

  test('Updated', async () => {
    const question = await fixture<Question>(Question, { permissions: [ Permission.UPDATE_QUESTION ] })
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app)
      .patch(`/questions/${ id.toString() }`)
      .send(schema)
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, id)).toMatchObject(schema)
  })
})