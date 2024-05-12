import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
// @ts-ignore
import { updateMeMutation } from '../../graphql/me/updateMeMutation'
import MeUpdateSchema from '../../../../src/schema/user/MeUpdateSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).patch('/me').send({ name: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch('/me').send({}).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Conflict', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch('/me').send({ email: user1.email }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Updated', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const schema = { name: 'any' }
    const res = await request(framework.app).patch('/me').send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<User>(User, user.id)).toMatchObject(schema)
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(framework.app).post('/graphql')
      .send(updateMeMutation({ meUpdate: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateMeMutation({} as { meUpdate: MeUpdateSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Conflict (GraphQL)', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateMeMutation({ meUpdate: { email: user1.email } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const meUpdate = { name: 'any' }
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(updateMeMutation({ meUpdate }, [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]))
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
            createdAt: user.createdAt.getTime(),
          },
          ...meUpdate,
        },
      },
    })
    expect(res.body.data.updateMe).toHaveProperty([ 'updatedAt' ])
    expect(res.body.data.updateMe.updatedAt).toBeGreaterThanOrEqual(now)
    expect(res.body.data.updateMe).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])
  })
})