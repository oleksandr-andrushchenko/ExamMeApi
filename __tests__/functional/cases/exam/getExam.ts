import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/Exam'
import User from '../../../../src/entities/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examQuery } from '../../graphql/exam/examQuery'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get('/exams/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.owner)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
  })
  test('Found (permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.owner)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { exam: { id: exam.id.toString() } } })
  })
  test('Found (permission) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await framework.auth(user)).token
    const fields = [
      'id',
      'category',
      'questionNumber',
      'completed',
      'owner',
      'questionsCount',
      'answeredCount',
      'created',
      'updated',
    ]
    const res = await request(framework.app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        exam: {
          id: exam.id.toString(),
          category: exam.category.toString(),
          questionNumber: exam.questionNumber,
          completed: exam.completed?.getTime() ?? null,
          owner: exam.owner.toString(),
          questionsCount: exam.getQuestionsCount(),
          answeredCount: exam.getQuestionsAnsweredCount(),
          created: exam.created.getTime(),
          updated: exam.updated?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.exam).not.toHaveProperty([ 'questions', 'correctCount', 'creator', 'deleted' ])
  })
})