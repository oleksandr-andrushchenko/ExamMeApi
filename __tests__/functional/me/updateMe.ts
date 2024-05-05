import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entities/User'
// @ts-ignore
import { updateMeMutation } from '../../graphql/me/updateMeMutation'
import MeUpdateSchema from '../../../src/schema/user/MeUpdateSchema'

describe('Update me', () => {
  test('Unauthorized', async () => {
    const res = await request(app).patch('/me').send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch('/me').send({}).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Conflict', async () => {
    const user1 = await fixture<User>(User)
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).patch('/me').send({ email: user1.email }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Updated', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const schema = { name: 'any' }
    const res = await request(app).patch('/me').send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<User>(User, user.id)).toMatchObject(schema)
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(app).post('/graphql')
      .send(updateMeMutation({ meUpdate: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateMeMutation({} as { meUpdate: MeUpdateSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Conflict (GraphQL)', async () => {
    const user1 = await fixture<User>(User)
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateMeMutation({ meUpdate: { email: user1.email } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Updated (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const meUpdate = { name: 'any' }
    const now = Date.now()
    const res = await request(app).post('/graphql')
      .send(updateMeMutation({ meUpdate }, [ 'id', 'name', 'email', 'permissions', 'created', 'updated' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        updateMe: {
          ...{
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            permissions: user.permissions,
            created: user.created.getTime(),
          },
          ...meUpdate,
        },
      },
    })
    expect(res.body.data.updateMe).toHaveProperty([ 'updated' ])
    expect(res.body.data.updateMe.updated).toBeGreaterThanOrEqual(now)
    expect(res.body.data.updateMe).not.toHaveProperty([ 'password', 'creator', 'deleted' ])
  })
})