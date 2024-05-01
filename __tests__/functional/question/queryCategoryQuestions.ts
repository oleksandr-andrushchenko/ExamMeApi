import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, server as app } from '../../index'
import Category from '../../../src/entities/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../src/entities/Question'

describe('GET /categories/:categoryId/questions', () => {
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
    const categoryId = 'invalid'
    const res = await request(app).get(`/categories/${ categoryId.toString() }/questions`).query(query)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Empty', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const res = await request(app).get(`/categories/${ categoryId.toString() }/questions`)

    expect(res.status).toEqual(200)
    expect(res.body.data).toEqual([])
  })
  test('Not empty', async () => {
    const category = await fixture<Category>(Category)
    const categoryId = category.id
    const questions = await Promise.all([
      fixture<Question>(Question, { category: categoryId }),
      fixture<Question>(Question, { category: categoryId }),
    ])

    const res = await request(app).get(`/categories/${ categoryId.toString() }/questions`)

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
          question.answers.forEach((choice: QuestionAnswer, index2: number) => {
            expect(body[index].answers[index2]).toMatchObject({
              variants: choice.variants,
              correct: choice.correct,
              explanation: choice.explanation ?? null,
            })
          })
        } else if (question.type === QuestionType.CHOICE) {
          expect(body[index]).toHaveProperty('choices')
          question.choices.forEach((choice: QuestionChoice, index2: number) => {
            expect(body[index].choices[index2]).toMatchObject({
              title: choice.title,
              correct: choice.correct,
              explanation: choice.explanation ?? null,
            })
          })
        }
      })
  })
})