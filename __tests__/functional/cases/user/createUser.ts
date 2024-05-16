import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
import { ObjectId } from 'mongodb'
import UserPermission from '../../../../src/enums/user/UserPermission'
// @ts-ignore
import { addUserMutation } from '../../graphql/user/addUserMutation'
import UserSchema from '../../../../src/schema/user/UserSchema'
import Permission from '../../../../src/enums/Permission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create user', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(addUserMutation({ user: { email: 'a@a.com', password: 'password' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty user', user: {}, times: 2 },
    { case: 'name is an object', user: { name: {}, email: 'a@a.com', password: 'password' } },
    { case: 'name is a number', user: { name: 123123, email: 'a@a.com', password: 'password' } },
    { case: 'name is too short', user: { name: 'a', email: 'a@a.com', password: 'password' } },
    { case: 'name is too long', user: { name: 'abc'.repeat(99), email: 'a@a.com', password: 'password' } },
    { case: 'email is missed', user: { password: 'password' } },
    { case: 'email is null', user: { email: null, password: 'password' } },
    { case: 'email is undefined', user: { email: undefined, password: 'password' } },
    { case: 'email is a number', user: { email: 123123, password: 'password' } },
    { case: 'email is an object', user: { email: {}, password: 'password' } },
    { case: 'password is missed', user: { email: 'a@a.com' } },
    { case: 'password is null', user: { email: 'a@a.com', password: null } },
    { case: 'password is undefined', user: { email: 'a@a.com', password: undefined } },
    { case: 'password is a number', user: { email: 'a@a.com', password: 123123 } },
    { case: 'password is an object', user: { email: 'a@a.com', password: {} } },
    { case: 'password is too short', user: { email: 'a@a.com', password: 'p' } },
    { case: 'password is too long', user: { email: 'a@a.com', password: 'abc'.repeat(99) } },
    { case: 'permissions is a string', user: { email: 'a@a.com', password: 'password', permissions: 'invalid' } },
    { case: 'permissions is an integer', user: { email: 'a@a.com', password: 'password', permissions: 123 } },
    { case: 'permissions is an object', user: { email: 'a@a.com', password: 'password', permissions: {} } },
    { case: 'permissions is invalid', user: { email: 'a@a.com', password: 'password', permissions: [ 'any' ] } },
  ])('Bad request ($case)', async ({ user: userCreate, times = 1 }) => {
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(addUserMutation({ user: userCreate as UserSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(addUserMutation({
        user: {
          name: 'any',
          email: 'a@a.com',
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(addUserMutation({
        user: {
          name: 'any',
          email: user1.email,
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(User)
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await framework.auth(user)).token
    const userCreate = { name: 'any', email: 'a@a.com' }
    const fields = [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(addUserMutation({ user: { ...userCreate, ...{ password: '123123' } } }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('addUser')
    expect(res.body.data.addUser).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addUser.id)
    const latestUser = await framework.load<User>(User, id)
    expect(latestUser).toMatchObject(userCreate)
    expect(res.body.data.addUser).toMatchObject({
      id: id.toString(),
      name: latestUser.name,
      email: latestUser.email,
      permissions: [ Permission.REGULAR ],
      createdAt: latestUser.createdAt.getTime(),
      updatedAt: null,
    })
    expect(latestUser.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addUser).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])
  })
})