import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import { error, fakeId, fixture, server as app } from '../../index'
import Category from '../../../src/entity/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../src/entity/Question'

describe('GET /questions/:questionId', () => {
  test('Not found (question)', async () => {
    const questionId = await fakeId()
    const res = await request(app).get(`/questions/${ questionId.toString() }`)

    expect(res.status).toEqual(404)
    expect(res.body).toMatchObject(error('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const id = 'invalid'
    const res = await request(app).get(`/questions/${ id.toString() }`)

    expect(res.status).toEqual(400)
    expect(res.body).toMatchObject(error('BadRequestError'))
  })
  test('Found', async () => {
    const category = await fixture<Category>(Category)
    const question = await fixture<Question>(Question, { category: category.id })
    const questionId = question.id
    const res = await request(app).get(`/questions/${ questionId.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: questionId.toString(),
      type: question.type,
      difficulty: question.difficulty,
      title: question.title,
    })

    if (question.type === QuestionType.TYPE) {
      expect(res.body).toHaveProperty('answers')
      question.answers.forEach((choice: QuestionAnswer, index: number) => {
        expect(res.body.answers[index]).toMatchObject({
          variants: choice.variants,
          correct: choice.correct,
          explanation: choice.explanation ?? null,
        })
      })
    } else if (question.type === QuestionType.CHOICE) {
      expect(res.body).toHaveProperty('choices')
      question.choices.forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.choices[index]).toMatchObject({
          title: choice.title,
          correct: choice.correct,
          explanation: choice.explanation ?? null,
        })
      })
    }
  })
})