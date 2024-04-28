import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, load, server as app } from '../../index'
import User from '../../../src/entity/User'
import Exam from '../../../src/entity/Exam'
import Category from '../../../src/entity/Category'
import { ObjectId } from 'mongodb'
import ExamPermission from '../../../src/enum/exam/ExamPermission'

describe('POST /exams', () => {
  test('Unauthorized', async () => {
    const category = await fixture<Category>(Category)
    const id = category.getId()
    const res = await request(app).post('/exams').send({ category: id.toString() })

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
    const id = category.getId()
    const res = await request(app).post('/exams').send({ category: id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(403)
    expect(res.body).toMatchObject(error('ForbiddenError'))
  })

  test('Conflict (exam taken)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const exam = await fixture<Exam>(Exam, { creator: user.getId() })
    const id = exam.getCategory()
    const res = await request(app).post('/exams').send({ category: id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(409)
    expect(res.body).toMatchObject(error('ConflictError'))
  })

  test('Created', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.CREATE ] })
    const token = (await auth(user)).token
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/exams').send({ category: category.getId() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(201)
    expect(res.body).toHaveProperty('id')
    const id = new ObjectId(res.body.id)
    expect(await load<Exam>(Exam, id)).toMatchObject({ id })
  })
})