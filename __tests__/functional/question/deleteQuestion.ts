import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Question from '../../../src/entity/Question'
import User from '../../../src/entity/User'
import QuestionPermission from '../../../src/enum/question/QuestionPermission'

describe('DELETE /questions/:questionId', () => {
  const app = api()

  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).delete(`/questions/${ id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = 'invalid'
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Deleted (has ownership)', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Question>(Question, id)).toBeNull()
  })

  test('Deleted (has permission)', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const permissions = [
      QuestionPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Question>(Question, id)).toBeNull()
  })
})