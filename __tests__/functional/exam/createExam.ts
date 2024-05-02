import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, graphqlError, load, server as app } from '../../index'
import User from '../../../src/entities/User'
import Exam from '../../../src/entities/Exam'
import Category from '../../../src/entities/Category'
import { ObjectId } from 'mongodb'
import ExamPermission from '../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { addExamMutation } from '../../graphql/exam/addExamMutation'
import CreateExamSchema from '../../../src/schema/exam/CreateExamSchema'

describe('Create exam', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/exams').send({ category: category.id.toString() })

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/exams').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/exams').send({ category: category.id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })
  test('Conflict (exam taken)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam, { creator: user.id })
    const res = await request(app).post('/exams').send({ category: exam.category.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })
  test('Created', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/exams').send({ category: category.id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    expect(await load<Exam>(Exam, id)).toMatchObject({ id })
  })
  test('Unauthorized (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/graphql')
      .send(addExamMutation({ exam: { category: category.id.toString() } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(addExamMutation({ exam: {} as CreateExamSchema }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Forbidden (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/graphql')
      .send(addExamMutation({ exam: { category: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ForbiddenError'))
  })
  test('Conflict (exam taken) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam, { creator: user.id })
    const res = await request(app).post('/graphql')
      .send(addExamMutation({ exam: { category: exam.category.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('ConflictError'))
  })
  test('Created (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/graphql')
      .send(addExamMutation({ exam: { category: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('addExam')
    const id = new ObjectId(res.body.data.addExam.id)
    expect(await load<Exam>(Exam, id)).toMatchObject({ id })
  })
})