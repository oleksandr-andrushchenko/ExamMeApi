import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, auth, error, fakeId, fixture, load } from '../../index'
import Question from '../../../src/entity/Question'
import User from '../../../src/entity/User'
import Permission from '../../../src/enum/auth/Permission'

describe('DELETE /questions/:question_id', () => {
  const app = api()

  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const res = await request(app).delete(`/questions/${ id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })

  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.DELETE_QUESTION ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })

  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.REGULAR ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User, { permissions: [ Permission.DELETE_QUESTION ] })
    const question = await fixture<Question>(Question)
    const id = question.getId()
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Deleted', async () => {
    const question = await fixture<Question>(Question, { permissions: [ Permission.DELETE_QUESTION ] })
    const id = question.getId()
    const user = await load<User>(User, question.getCreator())
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Question>(Question, id)).toBeNull()
  })
})