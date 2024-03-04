import { describe, expect, test } from '@jest/globals';
import request from "supertest";
// @ts-ignore
import { api, fixture, error, fakeId } from "../../index";
import Category from "../../../src/entity/Category";
import Question, { QuestionChoice, QuestionType } from "../../../src/entity/Question";

describe('GET /questions/:question_id', () => {
  const app = api();

  test('Not found (question)', async () => {
    const questionId = await fakeId();
    const res = await request(app).get(`/questions/${ questionId.toString() }`);

    expect(res.status).toEqual(404);
    expect(res.body).toMatchObject(error('NotFoundError'));
  });

  test('Found', async () => {
    const category = await fixture<Category>(Category);
    const question = await fixture<Question>(Question, { category: category.getId() });
    const questionId = question.getId();
    const res = await request(app).get(`/questions/${ questionId.toString() }`);

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject({
      id: questionId.toString(),
      type: question.getType(),
      difficulty: question.getDifficulty(),
      title: question.getTitle(),
    });

    if (question.getType() === QuestionType.TYPE) {
      expect(res.body).toHaveProperty('answers');
      expect(res.body.answers).toEqual(question.getAnswers());
      expect(res.body).toHaveProperty('explanation');
      expect(res.body.explanation).toEqual(question.getExplanation());
    } else if (question.getType() === QuestionType.CHOICE) {
      expect(res.body).toHaveProperty('choices');
      question.getChoices().forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.choices[index]).toMatchObject({
          title: choice.getTitle(),
          correct: choice.isCorrect(),
          explanation: choice.getExplanation() ?? null,
        });
      });
    }
  });
});