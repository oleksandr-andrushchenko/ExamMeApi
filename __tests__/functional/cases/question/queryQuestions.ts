import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../../src/entities/Question'
// @ts-ignore
import { questionsQuery } from '../../graphql/question/questionsQuery'
import QuestionQuerySchema from '../../../../src/schema/question/QuestionQuerySchema'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Query questions', () => {
  test('Not Found', async () => {
    const categoryId = await framework.fakeId()
    const res = await request(framework.app).get(`/categories/${ categoryId.toString() }/questions`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(framework.error('NotFoundError'))
  })
  test.each([
    { case: 'invalid category', query: { categoryId: 'any' } },
    { case: 'invalid price', query: { price: 'any' } },
    { case: 'invalid difficulty', query: { difficulty: 'any' } },
    { case: 'invalid type', query: { type: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(framework.app).get('/categories/invalid/questions').query(query)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(framework.error('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).get(`/categories/${ category.id.toString() }/questions`)

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })
  test('Not empty', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    const questions = await Promise.all([
      framework.fixture<Question>(Question, { categoryId: category.id }),
      framework.fixture<Question>(Question, { categoryId: category.id }),
    ])

    const res = await request(framework.app).get(`/categories/${ category.id.toString() }/questions`)

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(questions.length)

    type resType = { [title: string]: string };
    const body = res.body.data.sort((a: resType, b: resType) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          categoryId: question.categoryId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
        })

        if (question.type === QuestionType.TYPE) {
          expect(body[index]).toHaveProperty('answers')
          question.answers.forEach((answer: QuestionAnswer, index2: number) => {
            expect(body[index].answers[index2]).toMatchObject(Object.assign({}, answer) as Record<string, any>)
          })
        } else if (question.type === QuestionType.CHOICE) {
          expect(body[index]).toHaveProperty('choices')
          question.choices.forEach((choice: QuestionChoice, index2: number) => {
            expect(body[index].choices[index2]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
          })
        }
      })
  })
  test.each([
    { case: 'invalid category', query: { categoryId: 'any' } },
    { case: 'invalid price', query: { price: 'any' } },
    { case: 'invalid difficulty', query: { difficulty: 'any' } },
    { case: 'invalid type', query: { type: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case) (GraphQL)', async ({ query }) => {
    const res = await request(framework.app).post('/graphql').send(questionsQuery(query as QuestionQuerySchema))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty by category (GraphQL)', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/graphql')
      .send(questionsQuery({ categoryId: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toEqual([])
  })
  test('Not empty by category (GraphQL)', async () => {
    await framework.clear()
    const category = await framework.fixture<Category>(Category)
    const questions = await Promise.all([
      framework.fixture<Question>(Question, { categoryId: category.id }),
      framework.fixture<Question>(Question, { categoryId: category.id }),
    ])
    const fields = [
      'id',
      'title',
      'categoryId',
      'type',
      'difficulty',
      'answers {variants correct explanation}',
      'choices {title correct explanation}',
    ]
    const res = await request(framework.app).post('/graphql')
      .send(questionsQuery({ categoryId: category.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toHaveLength(questions.length)

    const body = res.body.data.questions.sort((a: Question, b: Question) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          categoryId: question.categoryId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
        })

        if (question.type === QuestionType.TYPE) {
          expect(body[index]).toHaveProperty('answers')
          question.answers.forEach((answer: QuestionAnswer, index2: number) => {
            expect(body[index].answers[index2]).toMatchObject(Object.assign({}, answer) as Record<string, any>)
          })
        } else if (question.type === QuestionType.CHOICE) {
          expect(body[index]).toHaveProperty('choices')
          question.choices.forEach((choice: QuestionChoice, index2: number) => {
            expect(body[index].choices[index2]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
          })
        }
      })
  })
})