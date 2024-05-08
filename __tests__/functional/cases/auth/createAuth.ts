import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/User'
// @ts-ignore
import { authenticateMutation } from '../../graphql/auth/authenticateMutation'
import { CredentialsSchema } from '../../../../src/schema/auth/CredentialsSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create auth', () => {
  test.each([
    { case: 'empty body', body: {} },
    { case: 'no email', body: { password: 'any' } },
    { case: 'email is null', body: { email: null, password: 'any' } },
    { case: 'email is undefined', body: { email: undefined, password: 'any' } },
    { case: 'email is integer', body: { email: 111, password: 'any' } },
    { case: 'email is invalid', body: { email: 'invalid', password: 'any' } },
    { case: 'password is null', body: { email: 'any@any.com', password: null } },
    { case: 'password is integer', body: { email: 'any@any.com', password: 111 } },
    { case: 'password is too short', body: { email: 'any@any.com', password: 'a' } },
    { case: 'password is too long', body: { email: 'any@any.com', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } },
  ])('Bad request ($case)', async ({ body }) => {
    // @ts-ignore
    await framework.fixture<User>(User)
    // expect(1).toEqual(1)
    const res = await request(framework.app).post('/auth').send(body)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not Found', async () => {
    const credentials = { email: 'any@any.com', password: 'password' }
    const res = await request(framework.app).post('/auth').send(credentials)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden', async () => {
    // console.log(app)
    // @ts-ignore
    const user = await framework.fixture<User>(User)
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/auth').send(credentials)

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Created', async () => {
    // @ts-ignore
    const user = await framework.fixture<User>(User, { password: 'password' })
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/auth').send(credentials)

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('expires')
  })
  test.each([
    { case: 'empty credentials', credentials: {}, times: 2 },
    { case: 'no email', credentials: { password: 'any' } },
    { case: 'email is null', credentials: { email: null, password: 'any' } },
    { case: 'email is undefined', credentials: { email: undefined, password: 'any' } },
    { case: 'email is integer', credentials: { email: 111, password: 'any' } },
    { case: 'email is invalid', credentials: { email: 'invalid', password: 'any' } },
    { case: 'password is null', credentials: { email: 'any@any.com', password: null } },
    { case: 'password is integer', credentials: { email: 'any@any.com', password: 111 } },
    { case: 'password is too short', credentials: { email: 'any@any.com', password: 'a' } },
    { case: 'password is too long', credentials: { email: 'any@any.com', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } },
  ])('Bad request ($case) (GraphQL)', async ({ credentials, times = 1 }) => {
    const res = await request(framework.app).post('/graphql')
      .send(authenticateMutation({ credentials: credentials as CredentialsSchema }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Not Found (GraphQL)', async () => {
    const credentials = { email: 'any@any.com', password: 'password' }
    const res = await request(framework.app).post('/graphql').send(authenticateMutation({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    // @ts-ignore
    const user = await framework.fixture<User>(User)
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/graphql').send(authenticateMutation({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created (GraphQL)', async () => {
    // @ts-ignore
    const user = await framework.fixture<User>(User, { password: 'password' })
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/graphql').send(authenticateMutation({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body.data.authenticate).toHaveProperty('token')
  })
})