import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/Question'
import User from '../../../../src/entities/User'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { removeQuestionMutation } from '../../graphql/question/removeQuestionMutation'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).delete(`/questions/${ question.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete('/questions/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestQuestion = await framework.load<Question>(Question, question.id)
    expect(latestQuestion).not.toBeNull()
    expect(latestQuestion.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    const latestQuestion = await framework.load<Question>(Question, question.id)
    expect(latestQuestion).not.toBeNull()
    expect(latestQuestion.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Unauthorized (GraphQL)', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeQuestion: true } })
    const latestQuestion = await framework.load<Question>(Question, question.id)
    expect(latestQuestion).not.toBeNull()
    expect(latestQuestion.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.DELETE ] })
    const token = (await framework.auth(user)).token
    const now = Date.now()
    const res = await request(framework.app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeQuestion: true } })
    const latestQuestion = await framework.load<Question>(Question, question.id)
    expect(latestQuestion).not.toBeNull()
    expect(latestQuestion.deletedAt.getTime()).toBeGreaterThanOrEqual(now)
  })
})