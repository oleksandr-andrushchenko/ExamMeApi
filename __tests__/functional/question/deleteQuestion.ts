import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Question from '../../../src/entities/Question'
import User from '../../../src/entities/User'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { removeQuestionMutation } from '../../graphql/question/removeQuestionMutation'
import Category from '../../../src/entities/Category'

describe('Delete question', () => {
  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const res = await request(app).delete(`/questions/${ question.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).delete('/questions/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).delete(`/questions/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const question = await fixture<Question>(Question)
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Question>(Question, question.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const question = await fixture<Question>(Question)
    const permissions = [
      QuestionPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).delete(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(204)
    expect(res.body).toEqual({})
    expect(await load<Question>(Question, question.id)).toBeNull()
  })
  test('Unauthorized (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership) (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeQuestion: true } })
    expect(await load<Category>(Question, question.id)).toBeNull()
  })
  test('Deleted (has permission) (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const permissions = [
      QuestionPermission.DELETE,
    ]
    const user = await fixture<User>(User, { permissions })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(removeQuestionMutation({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { removeQuestion: true } })
    expect(await load<Category>(Question, question.id)).toBeNull()
  })
})