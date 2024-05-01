import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, load, server as app } from '../../index'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
import UserPermission from '../../../src/enums/user/UserPermission'

describe('POST /users', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post('/users')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/users').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/users').send({
      name: 'any',
      email: 'a@a.com',
      password: '123123',
    }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const user1 = await fixture<User>(User)
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/users').send({
      name: 'any',
      email: user1.email,
      password: '123123',
    }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Created', async () => {
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const schema = { name: 'any', email: 'a@a.com' }
    const res = await request(app)
      .post('/users')
      .send({ ...schema, ...{ password: '123123' } })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    expect(res.body).toMatchObject(schema)
    expect(await load<User>(User, id)).toMatchObject(schema)
  })
})