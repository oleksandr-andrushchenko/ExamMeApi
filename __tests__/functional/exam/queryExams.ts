import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, server as app } from '../../index'
import User from '../../../src/entity/User'
import Exam from '../../../src/entity/Exam'
import Category from '../../../src/entity/Category'
import ExamPermission from '../../../src/enum/exam/ExamPermission'

describe('GET /exams', () => {
  test('Unauthorized', async () => {
    const res = await request(app).get('/exams')

    expect(res.status).toEqual(401)
    expect(res.body).toMatchObject(error('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'invalid category type', query: { category: 1 } },
    { case: 'invalid category', query: { category: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get('/exams').query(query).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Empty', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).get('/exams').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })
  test('No filter (ownership)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const exams = (await Promise.all([
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam),
      fixture<Exam>(Exam, examOwnOptions),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const res = await request(app).get('/exams').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')

    const ownExams = exams.filter(exam => exam.owner.toString() === owner.toString())
    expect(res.body.data).toHaveLength(ownExams.length)
    expect(res.body).toHaveProperty('meta')

    const resExams = res.body.data.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownExams) {
      const resExam = resExams[index]

      for (const key of [ 'id', 'category', 'created', 'updated' ]) {
        expect(resExam).toHaveProperty(key)
      }

      expect(resExam.id).toEqual(ownExams[index].id.toString())
    }
  })
  test('Category filter (ownership)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const examCategoryOptions = { category: category.id }
    const exams = (await Promise.all([
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam, examCategoryOptions),
      fixture<Exam>(Exam, { ...examOwnOptions, ...examCategoryOptions }),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const res = await request(app).get('/exams').query({ category: category.id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')

    const ownCategoryExams = exams
      .filter(exam => exam.owner.toString() === owner.toString())
      .filter(exam => exam.category.toString() === category.id.toString())
    expect(res.body.data).toHaveLength(ownCategoryExams.length)
    expect(res.body).toHaveProperty('meta')

    const resExams = res.body.data.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownCategoryExams) {
      const resExam = resExams[index]

      for (const key of [ 'id', 'category', 'created', 'updated' ]) {
        expect(resExam).toHaveProperty(key)
      }

      expect(resExam.id).toEqual(ownCategoryExams[index].id.toString())
    }
  })
  test('No filter (permission)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const exams = (await Promise.all([
      fixture<Exam>(Exam),
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const res = await request(app).get('/exams').auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')

    expect(res.body.data).toHaveLength(exams.length)
    expect(res.body).toHaveProperty('meta')

    const resExams = res.body.data.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in exams) {
      const resExam = resExams[index]

      for (const key of [ 'id', 'category', 'created', 'updated' ]) {
        expect(resExam).toHaveProperty(key)
      }

      expect(resExam.id).toEqual(exams[index].id.toString())
    }
  })
  test('Category filter (permission)', async () => {
    const category = await fixture<Category>(Category)
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const examCategoryOptions = { category: category.id }
    const exams = (await Promise.all([
      fixture<Exam>(Exam),
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam, { ...examOwnOptions, ...examCategoryOptions }),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const res = await request(app).get('/exams').query({ category: category.id.toString() }).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')

    const categoryExams = exams
      .filter(exam => exam.category.toString() === category.id.toString())
    expect(res.body.data).toHaveLength(categoryExams.length)
    expect(res.body).toHaveProperty('meta')

    const resExams = res.body.data.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in categoryExams) {
      const resExam = resExams[index]

      for (const key of [ 'id', 'category', 'created', 'updated' ]) {
        expect(resExam).toHaveProperty(key)
      }

      expect(resExam.id).toEqual(categoryExams[index].id.toString())
    }
  })
})