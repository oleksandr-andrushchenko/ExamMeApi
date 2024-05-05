import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entities/User'
import { ObjectId } from 'mongodb'
// @ts-ignore
import { addMeMutation } from '../../graphql/me/addMeMutation'
import MeSchema from '../../../src/schema/user/MeSchema'
import Permission from '../../../src/enums/Permission'

describe('Create me', () => {
  test.each([
    { case: 'empty me', me: {} },
    { case: 'name is an object', me: { name: {}, email: 'a@a.com', 'password': 'password' } },
    { case: 'name is a number', me: { name: 123123, email: 'a@a.com', 'password': 'password' } },
    { case: 'name is too short', me: { name: 'a', email: 'a@a.com', 'password': 'password' } },
    { case: 'name is too long', me: { name: 'abc'.repeat(99), email: 'a@a.com', 'password': 'password' } },
    { case: 'email is missed', me: { 'password': 'password' } },
    { case: 'email is null', me: { email: null, 'password': 'password' } },
    { case: 'email is undefined', me: { email: undefined, 'password': 'password' } },
    { case: 'email is a number', me: { email: 123123, 'password': 'password' } },
    { case: 'email is an object', me: { email: {}, 'password': 'password' } },
    { case: 'password is missed', me: { email: 'a@a.com' } },
    { case: 'password is null', me: { email: 'a@a.com', 'password': null } },
    { case: 'password is undefined', me: { email: 'a@a.com', 'password': undefined } },
    { case: 'password is a number', me: { email: 'a@a.com', 'password': 123123 } },
    { case: 'password is an object', me: { email: 'a@a.com', 'password': {} } },
    { case: 'password is too short', me: { email: 'a@a.com', 'password': 'p' } },
    { case: 'password is too long', me: { email: 'a@a.com', 'password': 'abc'.repeat(99) } },
  ])('Bad request ($case)', async ({ me }) => {
    const res = await request(app).post('/me').send(me)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Conflict', async () => {
    const user = await fixture<User>(User)
    const res = await request(app).post('/me').send({
      name: 'any',
      email: user.email,
      password: '123123',
    })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Created', async () => {
    const me = { name: 'any', email: 'a@a.com' }
    const now = Date.now()
    const res = await request(app).post('/me').send({ ...me, ...{ password: '123123' } })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    const latestMe = await load<User>(User, id)
    expect(latestMe).toMatchObject(me)
    expect(res.body).toMatchObject({
      id: id.toString(),
      name: latestMe.name,
      email: latestMe.email,
      permissions: [ Permission.REGULAR ],
      created: latestMe.created.getTime(),
    })
    expect(latestMe.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body).not.toHaveProperty([ 'password', 'creator', 'updated', 'deleted' ])
  })
  test.each([
    { case: 'empty me', me: {}, times: 2 },
    { case: 'name is an object', me: { name: {}, email: 'a@a.com', 'password': 'password' } },
    { case: 'name is a number', me: { name: 123123, email: 'a@a.com', 'password': 'password' } },
    { case: 'name is too short', me: { name: 'a', email: 'a@a.com', 'password': 'password' } },
    { case: 'name is too long', me: { name: 'abc'.repeat(99), email: 'a@a.com', 'password': 'password' } },
    { case: 'email is missed', me: { 'password': 'password' } },
    { case: 'email is null', me: { email: null, 'password': 'password' } },
    { case: 'email is undefined', me: { email: undefined, 'password': 'password' } },
    { case: 'email is a number', me: { email: 123123, 'password': 'password' } },
    { case: 'email is an object', me: { email: {}, 'password': 'password' } },
    { case: 'password is missed', me: { email: 'a@a.com' } },
    { case: 'password is null', me: { email: 'a@a.com', 'password': null } },
    { case: 'password is undefined', me: { email: 'a@a.com', 'password': undefined } },
    { case: 'password is a number', me: { email: 'a@a.com', 'password': 123123 } },
    { case: 'password is an object', me: { email: 'a@a.com', 'password': {} } },
    { case: 'password is too short', me: { email: 'a@a.com', 'password': 'p' } },
    { case: 'password is too long', me: { email: 'a@a.com', 'password': 'abc'.repeat(99) } },
  ])('Bad request ($case) (GraphQL)', async ({ me, times = 1 }) => {
    const res = await request(app).post('/graphql')
      .send(addMeMutation({ me: me as MeSchema }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Conflict (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const res = await request(app).post('/graphql')
      .send(addMeMutation({
        me: {
          name: 'any',
          email: user.email,
          password: '123123',
        },
      }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    const me = { name: 'any', email: 'a@a.com' }
    const fields = [ 'id', 'name', 'email', 'permissions', 'created', 'updated' ]
    const now = Date.now()
    const res = await request(app).post('/graphql')
      .send(addMeMutation({ me: { ...me, ...{ password: '123123' } } }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('addMe')
    expect(res.body.data.addMe).toHaveProperty('id')
    const id = new ObjectId(res.body.data.addMe.id)
    const latestMe = await load<User>(User, id)
    expect(latestMe).toMatchObject(me)
    expect(res.body.data.addMe).toMatchObject({
      id: id.toString(),
      name: latestMe.name,
      email: latestMe.email,
      permissions: [ Permission.REGULAR ],
      created: latestMe.created.getTime(),
      updated: null,
    })
    expect(latestMe.created.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.addMe).not.toHaveProperty([ 'password', 'creator', 'deleted' ])
  })
})