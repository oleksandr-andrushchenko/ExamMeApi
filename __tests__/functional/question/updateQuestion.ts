import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Question from '../../../src/entities/Question'
import User from '../../../src/entities/User'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { updateQuestionMutation } from '../../graphql/question/updateQuestionMutation'
import QuestionUpdateSchema from '../../../src/schema/question/QuestionUpdateSchema'

describe('Update question', () => {
  test('Unauthorized', async () => {
    const question = await fixture<Question>(Question)
    const res = await request(app).patch(`/questions/${ question.id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const res = await request(app).patch('/questions/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).patch(`/questions/${ id.toString() }`)
      .send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const res = await request(app).patch(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const res = await request(app).patch(`/questions/${ question.id.toString() }`)
      .send({ title: question1.title }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    const question = await fixture<Question>(Question)
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, question.id)).toMatchObject(schema)
  })
  test('Updated (has permission)', async () => {
    const question = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await load<Question>(Question, question.id)).toMatchObject(schema)
  })
  test('Unauthorized (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({ questionId: question.id.toString(), questionUpdate: { title: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({ questionId: 'invalid', questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({ questionId: id.toString(), questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const question = await fixture<Question>(Question)
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: undefined as QuestionUpdateSchema,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const question = await fixture<Question>(Question, { owner: await fixture<User>(User) })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const question1 = await fixture<Question>(Question)
    const question = await fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: question1.title },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Updated (has ownership) (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const user = await load<User>(User, question.creator)
    const token = (await auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
  test('Updated (has permission) (GraphQL)', async () => {
    const question = await fixture<Question>(Question)
    const user = await fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(app).post('/graphql')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
})