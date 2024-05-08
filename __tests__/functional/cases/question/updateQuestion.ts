import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/Question'
import User from '../../../../src/entities/User'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { updateQuestionMutation } from '../../graphql/question/updateQuestionMutation'
import QuestionUpdateSchema from '../../../../src/schema/question/QuestionUpdateSchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`).send({ title: 'any' })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch('/questions/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).patch(`/questions/${ id.toString() }`)
      .send({ title: 'any' }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Forbidden (no permissions)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Forbidden (no ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question, { owner: await framework.fixture<User>(User) })
    const token = (await framework.auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await framework.fixture<Question>(Question)
    const question = await framework.fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const user = await framework.load<User>(User, question.creator)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`)
      .send({ title: question1.title }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(framework.error('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creator)
    const token = (await framework.auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(schema)
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const schema = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).patch(`/questions/${ question.id.toString() }`)
      .send(schema).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(205)
    expect(res.body).toEqual('')
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(schema)
  })
  test('Unauthorized (GraphQL)', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({ questionId: question.id.toString(), questionUpdate: { title: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({ questionId: 'invalid', questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({ questionId: id.toString(), questionUpdate: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: undefined as QuestionUpdateSchema,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden (no permissions) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (no ownership) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question, { owner: await framework.fixture<User>(User) })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: faker.lorem.sentences(3) },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (GraphQL)', async () => {
    const question1 = await framework.fixture<Question>(Question)
    const question = await framework.fixture<Question>(Question, { permissions: [ QuestionPermission.UPDATE ] })
    const user = await framework.load<User>(User, question.creator)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({
        questionId: question.id.toString(),
        questionUpdate: { title: question1.title },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership) (GraphQL)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creator)
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
  test('Updated (has permission) (GraphQL)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.UPDATE ] })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const questionUpdate = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/graphql')
      .send(updateQuestionMutation({ questionId, questionUpdate }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })
    expect(await framework.load<Question>(Question, question.id)).toMatchObject(questionUpdate)
  })
})