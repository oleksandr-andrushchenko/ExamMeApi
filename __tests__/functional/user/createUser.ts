import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
import UserPermission from '../../../src/enums/user/UserPermission'
// @ts-ignore
import { addUserMutation } from '../../graphql/user/addUserMutation'
import UserSchema from '../../../src/schema/user/UserSchema'
import Permission from '../../../src/enums/Permission'

describe('Create user', () => {
  test('Unauthorized', async () => {
    const res = await request(app).post('/users')
      .send({ email: 'a@a.com', password: 'password' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty user', user: {} },
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
  ])('Bad request ($case)', async ({ user: userCreate }) => {
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/users').send(userCreate).auth(token, { type: 'bearer' })

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
    const userCreate = { name: 'any', email: 'a@a.com' }
    const now = Date.now()
    const res = await request(app).post('/users')
      .send({ ...userCreate, ...{ password: '123123' } })
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    const latestUser = await load<User>(User, id)
    expect(latestUser).toMatchObject(userCreate)
    expect(res.body).toMatchObject({
      id: id.toString(),
      name: latestUser.name,
      email: latestUser.email,
      permissions: [ Permission.REGULAR ],
      created: latestUser.created.getTime(),
    })
    expect(latestUser.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body).not.toHaveProperty([ 'password', 'creator', 'updated', 'deleted' ])
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(app).post('/graphql')
      .send(addUserMutation({ user: { email: 'a@a.com', password: 'password' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
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
  ])('Bad request ($case) (GraphQL)', async ({ user: userCreate, times = 1 }) => {
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(addUserMutation({ user: userCreate as UserSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(addUserMutation({
        user: {
          name: 'any',
          email: 'a@a.com',
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const user1 = await fixture<User>(User)
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(addUserMutation({
        user: {
          name: 'any',
          email: user1.email,
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ UserPermission.CREATE ] })
    const token = (await auth(user)).token
    const userCreate = { name: 'any', email: 'a@a.com' }
    const fields = [ 'id', 'name', 'email', 'permissions', 'created', 'updated' ]
    const now = Date.now()
    const res = await request(app).post('/graphql')
      .send(addUserMutation({ user: { ...userCreate, ...{ password: '123123' } } }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('addUser')
    expect(res.body.data.addUser).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addUser.id)
    const latestUser = await load<User>(User, id)
    expect(latestUser).toMatchObject(userCreate)
    expect(res.body.data.addUser).toMatchObject({
      id: id.toString(),
      name: latestUser.name,
      email: latestUser.email,
      permissions: [ Permission.REGULAR ],
      created: latestUser.created.getTime(),
      updated: null,
    })
    expect(latestUser.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addUser).not.toHaveProperty([ 'password', 'creator', 'deleted' ])
  })
})