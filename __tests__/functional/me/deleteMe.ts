import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entities/User'
// @ts-ignore
import { removeMeMutation } from '../../graphql/me/removeMeMutation'

describe('Delete me', () => {
  test('Unauthorized', async () => {
    const res = await request(app).delete('/me')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Deleted', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).delete('/me').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<User>(User, user.id)).toBeNull()
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(app).post('/graphql')
      .send(removeMeMutation())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Deleted (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeMeMutation())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeMe: true } })
    expect(await load<User>(User, user.id)).toBeNull()
  })
})