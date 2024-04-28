import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, load, server as app } from '../../index'
import User from '../../../src/entity/User'

describe('PATCH /me', () => {
  test('Unauthorized', async () => {
    const res = await request(app).patch(`/me`).send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/me`).send({}).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Conflict', async () => {
    const user1 = await fixture<User>(User)
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/me`).send({ email: user1.getEmail() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Updated', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).patch(`/me`).send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<User>(User, user.getId())).toMatchObject(schema)
  })
})