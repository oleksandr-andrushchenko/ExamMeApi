import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { auth, error, fixture, graphqlError, server as app } from '../../index'
import User from '../../../src/entities/User'
import Exam from '../../../src/entities/Exam'
import Category from '../../../src/entities/Category'
import ExamPermission from '../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { examsQuery } from '../../graphql/exam/examsQuery'
import ExamQuerySchema from '../../../src/schema/exam/ExamQuerySchema'

describe('Query exams', () => {
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
      expect(resExams[index]).toMatchObject({
        id: ownExams[index].id.toString(),
        category: ownExams[index].category.toString(),
        questionNumber: ownExams[index].questionNumber,
        owner: ownExams[index].owner.toString(),
        created: ownExams[index].created.getTime(),
        updated: ownExams[index].updated.getTime(),
      })

      if (ownExams[index].completed) {
        expect(resExams[index]).toMatchObject({
          completed: ownExams[index].completed?.getTime() ?? null,
        })
      }

      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
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
      expect(resExams[index]).toMatchObject({
        id: ownCategoryExams[index].id.toString(),
        category: ownCategoryExams[index].category.toString(),
        questionNumber: ownCategoryExams[index].questionNumber,
        owner: ownCategoryExams[index].owner.toString(),
        created: ownCategoryExams[index].created.getTime(),
        updated: ownCategoryExams[index].updated.getTime(),
      })

      if (ownCategoryExams[index].completed) {
        expect(resExams[index]).toMatchObject({
          completed: ownCategoryExams[index].completed?.getTime() ?? null,
        })
      }

      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
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
      expect(resExams[index]).toMatchObject({
        id: exams[index].id.toString(),
        category: exams[index].category.toString(),
        questionNumber: exams[index].questionNumber,
        owner: exams[index].owner.toString(),
        created: exams[index].created.getTime(),
        updated: exams[index].updated.getTime(),
      })

      if (exams[index].completed) {
        expect(resExams[index]).toMatchObject({
          completed: exams[index].completed?.getTime() ?? null,
        })
      }

      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
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
      expect(resExams[index]).toMatchObject({
        id: categoryExams[index].id.toString(),
        category: categoryExams[index].category.toString(),
        questionNumber: categoryExams[index].questionNumber,
        owner: categoryExams[index].owner.toString(),
        created: categoryExams[index].created.getTime(),
        updated: categoryExams[index].updated.getTime(),
      })

      if (categoryExams[index].completed) {
        expect(resExams[index]).toMatchObject({
          completed: categoryExams[index].completed?.getTime() ?? null,
        })
      }

      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
    }
  })
  test('Unauthorized (GraphQL)', async () => {
    const res = await request(app).post('/graphql')
      .send(examsQuery())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('AuthorizationRequiredError'))
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
  ])('Bad request ($case) (GraphQL)', async ({ query }) => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examsQuery(query as ExamQuerySchema))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Empty (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const res = await request(app).post('/graphql')
      .send(examsQuery())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { exams: [] } })
  })
  test('No filter (ownership) (GraphQL)', async () => {
    const user = await fixture<User>(User)
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const exams = (await Promise.all([
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam),
      fixture<Exam>(Exam, examOwnOptions),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'category', 'questionNumber', 'completed', 'created', 'updated', 'owner' ]
    const res = await request(app).post('/graphql')
      .send(examsQuery({}, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const ownExams = exams.filter(exam => exam.owner.toString() === owner.toString())
    expect(res.body.data.exams).toHaveLength(ownExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownExams) {
      expect(resExams[index]).toMatchObject({
        id: ownExams[index].id.toString(),
        category: ownExams[index].category.toString(),
        questionNumber: ownExams[index].questionNumber,
        completed: ownExams[index].completed?.getTime() ?? null,
        owner: ownExams[index].owner.toString(),
        created: ownExams[index].created.getTime(),
        updated: ownExams[index].updated.getTime(),
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
    }
  })
  test('Category filter (ownership) (GraphQL)', async () => {
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

    const fields = [ 'id', 'category', 'questionNumber', 'completed', 'created', 'updated', 'owner' ]
    const res = await request(app).post('/graphql')
      .send(examsQuery({ category: category.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const ownCategoryExams = exams
      .filter(exam => exam.owner.toString() === owner.toString())
      .filter(exam => exam.category.toString() === category.id.toString())
    expect(res.body.data.exams).toHaveLength(ownCategoryExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownCategoryExams) {
      expect(resExams[index]).toMatchObject({
        id: ownCategoryExams[index].id.toString(),
        category: ownCategoryExams[index].category.toString(),
        questionNumber: ownCategoryExams[index].questionNumber,
        completed: ownCategoryExams[index].completed?.getTime() ?? null,
        owner: ownCategoryExams[index].owner.toString(),
        created: ownCategoryExams[index].created.getTime(),
        updated: ownCategoryExams[index].updated.getTime(),
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
    }
  })
  test('No filter (permission) (GraphQL)', async () => {
    const user = await fixture<User>(User, { permissions: [ ExamPermission.GET ] })
    const token = (await auth(user)).token
    const owner = user.id
    const examOwnOptions = { owner }
    const exams = (await Promise.all([
      fixture<Exam>(Exam),
      fixture<Exam>(Exam, examOwnOptions),
      fixture<Exam>(Exam),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'category', 'questionNumber', 'completed', 'created', 'updated', 'owner' ]
    const res = await request(app).post('/graphql')
      .send(examsQuery({}, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    expect(res.body.data.exams).toHaveLength(exams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in exams) {
      expect(resExams[index]).toMatchObject({
        id: exams[index].id.toString(),
        category: exams[index].category.toString(),
        questionNumber: exams[index].questionNumber,
        completed: exams[index].completed?.getTime() ?? null,
        owner: exams[index].owner.toString(),
        created: exams[index].created.getTime(),
        updated: exams[index].updated.getTime(),
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
    }
  })
  test('Category filter (permission) (GraphQL)', async () => {
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

    const fields = [ 'id', 'category', 'questionNumber', 'completed', 'created', 'updated', 'owner' ]
    const res = await request(app).post('/graphql')
      .send(examsQuery({ category: category.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const categoryExams = exams.filter(exam => exam.category.toString() === category.id.toString())
    expect(res.body.data.exams).toHaveLength(categoryExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in categoryExams) {
      expect(resExams[index]).toMatchObject({
        id: categoryExams[index].id.toString(),
        category: categoryExams[index].category.toString(),
        questionNumber: categoryExams[index].questionNumber,
        completed: categoryExams[index].completed?.getTime() ?? null,
        owner: categoryExams[index].owner.toString(),
        created: categoryExams[index].created.getTime(),
        updated: categoryExams[index].updated.getTime(),
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creator', 'deleted' ])
    }
  })
})