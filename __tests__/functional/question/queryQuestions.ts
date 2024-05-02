import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, graphqlError, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../src/entities/Question'
// @ts-ignore
import { questionsQuery } from '../../graphql/question/questionsQuery'
import QuestionQuerySchema from '../../../src/schema/question/QuestionQuerySchema'

describe('Query questions', () => {
  test('Not Found', async () => {
    const categoryId = await fakeId()
    const res = await request(app).get(`/categories/${ categoryId.toString() }/questions`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test.each([
    { case: 'invalid category', query: { category: 'any' } },
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
    const res = await request(app).get('/categories/invalid/questions').query(query)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Empty', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).get(`/categories/${ category.id.toString() }/questions`)

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })
  test('Not empty', async () => {
    const category = await fixture<Category>(Category)
    const questions = await Promise.all([
      fixture<Question>(Question, { category: category.id }),
      fixture<Question>(Question, { category: category.id }),
    ])

    const res = await request(app).get(`/categories/${ category.id.toString() }/questions`)

    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveLength(questions.length)

    type resType = { [title: string]: string };
    const body = res.body.data.sort((a: resType, b: resType) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          category: question.category.toString(),
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
    { case: 'invalid category', query: { category: 'any' } },
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
    const res = await request(app).post('/graphql').send(questionsQuery(query as QuestionQuerySchema))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(graphqlError('BadRequestError'))
  })
  test('Empty by category (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const res = await request(app).post('/graphql').send(questionsQuery({ category: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toEqual([])
  })
  test('Not empty by category (GraphQL)', async () => {
    const category = await fixture<Category>(Category)
    const questions = await Promise.all([
      fixture<Question>(Question, { category: category.id }),
      fixture<Question>(Question, { category: category.id }),
    ])
    const fields = [
      'id',
      'title',
      'category',
      'type',
      'difficulty',
      'answers {variants correct explanation}',
      'choices {title correct explanation}',
    ]
    const res = await request(app).post('/graphql').send(questionsQuery({ category: category.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toHaveLength(questions.length)

    const body = res.body.data.questions.sort((a: Question, b: Question) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          category: question.category.toString(),
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