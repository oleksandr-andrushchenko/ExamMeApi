import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/Exam'
import User from '../../../../src/entities/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { addExamCompletionMutation } from '../../graphql/exam/addExamCompletionMutation'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create exam completion', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post(`/exams/${ exam.id.toString() }/completion`)

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(framework.error('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post(`/exams/invalid/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post(`/exams/${ id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post(`/exams/${ exam.id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(framework.error('ForbiddenError'))
  })
  test('Created (has ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.owner)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post(`/exams/${ exam.id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
    expect(res.body).toHaveProperty('completed')
    expect(res.body.completed).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.completed)
  })
  test('Created (has permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post(`/exams/${ exam.id.toString() }/completion`).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toMatchObject({ id: exam.id.toString() })
    expect(res.body).toHaveProperty('completed')
    expect(res.body.completed).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.completed)
  })
  test('Unauthorized (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id) (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (GraphQL)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created (has ownership) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.owner)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: exam.id.toString() }, [ 'id', 'completed' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addExamCompletion: { id: exam.id.toString() } } })
    expect(res.body.data.addExamCompletion.completed).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.data.addExamCompletion.completed)
  })
  test('Created (has permission) (GraphQL)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.GET, ExamPermission.CREATE_COMPLETION ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/graphql')
      .send(addExamCompletionMutation({ examId: exam.id.toString() }, [ 'id', 'completed' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { addExamCompletion: { id: exam.id.toString() } } })
    expect(res.body.data.addExamCompletion.completed).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completed.getTime()).toEqual(res.body.data.addExamCompletion.completed)
  })
})