import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
// @ts-ignore
import { api, error, fakeId, fixture } from '../../index'
import Category from '../../../src/entity/Category'
import Question, { QuestionAnswer, QuestionChoice, QuestionType } from '../../../src/entity/Question'

describe('GET /questions/:question_id', () => {
  const app = api()

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
    const question = await fixture<Question>(Question, { category: category.getId() })
    const questionId = question.getId()
    const res = await request(app).get(`/questions/${ questionId.toString() }`)

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      id: questionId.toString(),
      type: question.getType(),
      difficulty: question.getDifficulty(),
      title: question.getTitle(),
    })

    if (question.getType() === QuestionType.TYPE) {
      expect(res.body).toHaveProperty('answers')
      question.getAnswers().forEach((choice: QuestionAnswer, index: number) => {
        expect(res.body.answers[index]).toMatchObject({
          variants: choice.getVariants(),
          correct: choice.isCorrect(),
          explanation: choice.getExplanation() ?? null,
        })
      })
    } else if (question.getType() === QuestionType.CHOICE) {
      expect(res.body).toHaveProperty('choices')
      question.getChoices().forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.choices[index]).toMatchObject({
          title: choice.getTitle(),
          correct: choice.isCorrect(),
          explanation: choice.getExplanation() ?? null,
        })
      })
    }
  })
})