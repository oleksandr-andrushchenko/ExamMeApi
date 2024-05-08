import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Replace me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).put('/me').send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).put('/me').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Conflict', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const schema = { name: 'any', email: user1.email, password: '123123' }
    const res = await request(framework.app).put('/me').send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Replaced', async () => {
    await framework.clear(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const schema = { name: 'any', email: 'a@a.com' }
    const res = await request(framework.app).put('/me').send({ ...schema, ...{ password: '123123' } }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<User>(User, user.id)).toMatchObject(schema)
  })
})