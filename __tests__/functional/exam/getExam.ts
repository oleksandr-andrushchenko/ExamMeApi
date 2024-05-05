import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fakeId, fixture, graphqlError, load, server as app } from '../../index'
import Exam from '../../../src/entities/Exam'
import User from '../../../src/entities/User'
import ExamPermission from '../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examQuery } from '../../graphql/exam/examQuery'

describe('Get exam', () => {
  test('Unauthorized', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).get(`/exams/${ exam.id.toString() }`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const res = await request(app).get('/exams/invalid').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).get(`/exams/${ id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
  })
  test('Found (permission)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const res = await request(app).get(`/exams/${ exam.id.toString() }`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const res = await request(app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuery({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const id = await fakeId()
    const res = await request(app).post('/graphql')
      .send(examQuery({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const exam = await fixture<Exam>(Exam)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Found (ownership) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await load<User>(User, exam.owner)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examQuery({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { exam: { id: exam.id.toString() } } })
  })
  test('Found (permission) (GraphQL)', async () => {
    const exam = await fixture<Exam>(Exam)
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const fields = [ 'id', 'category', 'questionNumber', 'completed', 'owner', 'questionsCount', 'answeredCount', 'created', 'updated' ]
    const res = await request(app).post('/graphql')
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